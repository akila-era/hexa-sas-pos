import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import PrimeDataTable from "../components/data-table";
import TooltipIcons from '../components/tooltip-content/tooltipIcons';
import RefreshIcon from '../components/tooltip-content/refresh';
import CollapesIcon from '../components/tooltip-content/collapes';
import { packagesService } from '../services/superadmin.service';

const Packages = () => {
  const [data, setData] = useState([]);
  const [rows, setRows] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 8, active: 8, inactive: 0, planTypes: 2 });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Form state for Add Package
  const [addFormData, setAddFormData] = useState({
    name: '',
    type: '',
    price: '',
    position: '',
    discountType: '',
    discount: '',
    maxInvoices: '',
    maxCustomers: '',
    maxProducts: '',
    maxSuppliers: '',
    modules: [],
    accessTrial: false,
    trialDays: '',
    isRecommended: false,
    status: 'Active',
    description: '',
    image: null
  });

  // Form state for Edit Package
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: '',
    price: '',
    position: '',
    discountType: '',
    discount: '',
    maxInvoices: '',
    maxCustomers: '',
    maxProducts: '',
    maxSuppliers: '',
    modules: [],
    accessTrial: false,
    trialDays: '',
    isRecommended: false,
    status: 'Active',
    description: '',
    image: null
  });

  // Fetch packages from API
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await packagesService.getAll({ page: currentPage, limit: rows });
      if (response?.success && response?.data) {
        const packagesData = Array.isArray(response.data) ? response.data : (response.data.packages || []);
        // Transform data to match UI format
        const transformedData = packagesData.map((pkg, index) => ({
          key: pkg.id || String(index + 1),
          id: pkg.id,
          Plan_Name: pkg.name,
          Plan_Type: pkg.type,
          Total_Subscribers: pkg.totalSubscribers || pkg._count?.subscriptions || 0,
          Price: `$${parseFloat(pkg.price)}`,
          Created_Date: new Date(pkg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          Status: pkg.status === 'ACTIVE' ? 'Active' : 'Inactive',
          rawData: pkg // Store raw data for editing
        }));
        setData(transformedData);
        setTotalRecords(response.pagination?.total || transformedData.length);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      // Don't show alert for TENANT_INACTIVE errors as they're handled by the API interceptor
      const errorCode = error?.error?.code || error?.response?.data?.error?.code;
      if (errorCode !== 'TENANT_INACTIVE' && errorCode !== 'ACCOUNT_INACTIVE') {
        const errorMessage = error?.error?.message || error?.response?.data?.error?.message || error.message || 'Unknown error';
        alert('Error fetching packages: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await packagesService.getStats();
      if (response?.success && response?.data) {
        setStats({
          total: response.data.totalPackages || 8,
          active: response.data.activePackages || 8,
          inactive: response.data.inactivePackages || 0,
          planTypes: response.data.planTypes || 2
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show alert for TENANT_INACTIVE errors as they're handled by the API interceptor
      const errorCode = error?.error?.code || error?.response?.data?.error?.code;
      if (errorCode !== 'TENANT_INACTIVE' && errorCode !== 'ACCOUNT_INACTIVE') {
        // Stats errors are less critical, so we just log them
        // The page will still display with default/previous stats
      }
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchStats();
  }, [fetchPackages, fetchStats]);

  // Handle delete package
  const handleDeletePackage = async () => {
    if (!deleteId) return;
    try {
      const response = await packagesService.delete(deleteId);
      if (response?.success) {
        alert('Package deleted successfully!');
        fetchPackages();
        fetchStats();
        setDeleteId(null);
        // Close modal
        const modal = document.getElementById('delete_modal');
        if (modal) {
          const bsModal = window.bootstrap?.Modal?.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Error deleting package: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  // Handle edit click - load package data
  const handleEditClick = async (pkg) => {
    try {
      const packageId = pkg.id || pkg.key;
      if (!packageId) {
        alert('Package ID not found');
        return;
      }
      
      const response = await packagesService.getById(packageId);
      if (response?.success && response?.data) {
        const pkgData = response.data;
        setEditFormData({
          name: pkgData.name || '',
          type: pkgData.type || '',
          price: parseFloat(pkgData.price) || '',
          position: pkgData.position?.toString() || '',
          discountType: pkgData.discountType || '',
          discount: parseFloat(pkgData.discount) || '',
          maxInvoices: pkgData.maxInvoices?.toString() || '',
          maxCustomers: pkgData.maxCustomers?.toString() || '',
          maxProducts: pkgData.maxProducts?.toString() || '',
          maxSuppliers: pkgData.maxSuppliers?.toString() || '',
          modules: pkgData.modules || [],
          accessTrial: (pkgData.trialDays || 0) > 0,
          trialDays: pkgData.trialDays?.toString() || '',
          isRecommended: pkgData.isRecommended || false,
          status: pkgData.status === 'ACTIVE' ? 'Active' : 'Inactive',
          description: pkgData.description || '',
          image: pkgData.image || null
        });
        setSelectedPackage(pkgData);
      }
    } catch (error) {
      console.error('Error loading package:', error);
      alert('Error loading package: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  // Reset add form
  const resetAddForm = () => {
    setAddFormData({
      name: '',
      type: '',
      price: '',
      position: '',
      discountType: '',
      discount: '',
      maxInvoices: '',
      maxCustomers: '',
      maxProducts: '',
      maxSuppliers: '',
      modules: [],
      accessTrial: false,
      trialDays: '',
      isRecommended: false,
      status: 'Active',
      description: '',
      image: null
    });
    setFormErrors({});
  };

  // Handle add package form submission
  const handleAddPackage = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});

    try {
      // Validate required fields
      const errors = {};
      if (!addFormData.name) errors.name = 'Plan Name is required';
      if (!addFormData.type) errors.type = 'Plan Type is required';
      if (!addFormData.price || parseFloat(addFormData.price) < 0) errors.price = 'Valid price is required';

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setFormLoading(false);
        return;
      }

      // Prepare data for API
      const packageData = {
        name: addFormData.name,
        type: addFormData.type,
        price: parseFloat(addFormData.price),
        position: addFormData.position ? parseInt(addFormData.position) : 0,
        discountType: addFormData.discountType || undefined,
        discount: addFormData.discount ? parseFloat(addFormData.discount) : 0,
        maxInvoices: addFormData.maxInvoices ? parseInt(addFormData.maxInvoices) : undefined,
        maxCustomers: addFormData.maxCustomers ? parseInt(addFormData.maxCustomers) : undefined,
        maxProducts: addFormData.maxProducts ? parseInt(addFormData.maxProducts) : undefined,
        maxSuppliers: addFormData.maxSuppliers ? parseInt(addFormData.maxSuppliers) : undefined,
        modules: addFormData.modules || [],
        isRecommended: addFormData.isRecommended || false,
        trialDays: addFormData.accessTrial && addFormData.trialDays ? parseInt(addFormData.trialDays) : 0,
        status: addFormData.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
        description: addFormData.description || undefined,
        image: addFormData.image || undefined
      };

      const response = await packagesService.create(packageData);
      if (response?.success) {
        alert('Package created successfully!');
        resetAddForm();
        fetchPackages();
        fetchStats();
        // Close modal
        const modal = document.getElementById('add_plans');
        if (modal) {
          const bsModal = window.bootstrap?.Modal?.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    } catch (error) {
      console.error('Error creating package:', error);
      const errorMsg = error.response?.data?.error?.message || error.message || 'Error creating package';
      alert(errorMsg);
      if (error.response?.data?.error?.fields) {
        setFormErrors(error.response.data.error.fields);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update package form submission
  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    if (!selectedPackage?.id) {
      alert('Package ID not found');
      return;
    }

    setFormLoading(true);
    setFormErrors({});

    try {
      // Validate required fields
      const errors = {};
      if (!editFormData.name) errors.name = 'Plan Name is required';
      if (!editFormData.type) errors.type = 'Plan Type is required';
      if (!editFormData.price || parseFloat(editFormData.price) < 0) errors.price = 'Valid price is required';

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setFormLoading(false);
        return;
      }

      // Prepare data for API
      const packageData = {
        name: editFormData.name,
        type: editFormData.type,
        price: parseFloat(editFormData.price),
        position: editFormData.position ? parseInt(editFormData.position) : undefined,
        discountType: editFormData.discountType || undefined,
        discount: editFormData.discount ? parseFloat(editFormData.discount) : undefined,
        maxInvoices: editFormData.maxInvoices ? parseInt(editFormData.maxInvoices) : undefined,
        maxCustomers: editFormData.maxCustomers ? parseInt(editFormData.maxCustomers) : undefined,
        maxProducts: editFormData.maxProducts ? parseInt(editFormData.maxProducts) : undefined,
        maxSuppliers: editFormData.maxSuppliers ? parseInt(editFormData.maxSuppliers) : undefined,
        modules: editFormData.modules || [],
        isRecommended: editFormData.isRecommended || false,
        trialDays: editFormData.accessTrial && editFormData.trialDays ? parseInt(editFormData.trialDays) : 0,
        status: editFormData.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
        description: editFormData.description || undefined,
        image: editFormData.image || undefined
      };

      const response = await packagesService.update(selectedPackage.id, packageData);
      if (response?.success) {
        alert('Package updated successfully!');
        fetchPackages();
        fetchStats();
        // Close modal
        const modal = document.getElementById('edit_plans');
        if (modal) {
          const bsModal = window.bootstrap?.Modal?.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    } catch (error) {
      console.error('Error updating package:', error);
      const errorMsg = error.response?.data?.error?.message || error.message || 'Error updating package';
      alert(errorMsg);
      if (error.response?.data?.error?.fields) {
        setFormErrors(error.response.data.error.fields);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle module checkbox change
  const handleModuleChange = (moduleName, isAdd, formType = 'add') => {
    const formData = formType === 'add' ? addFormData : editFormData;
    const setFormData = formType === 'add' ? setAddFormData : setEditFormData;
    
    const modules = [...formData.modules];
    if (isAdd) {
      if (!modules.includes(moduleName)) {
        modules.push(moduleName);
      }
    } else {
      const index = modules.indexOf(moduleName);
      if (index > -1) {
        modules.splice(index, 1);
      }
    }
    setFormData({ ...formData, modules });
  };

  // Handle select all modules
  const handleSelectAllModules = (checked, formType = 'add') => {
    const allModules = ['Employees', 'Invoices', 'Reports', 'Contacts', 'Clients', 'Estimates', 'Goals', 'Deals', 'Projects', 'Payments', 'Assets', 'Leads', 'Tickets', 'Taxes', 'Activities', 'Pipelines'];
    const formData = formType === 'add' ? addFormData : editFormData;
    const setFormData = formType === 'add' ? setAddFormData : setEditFormData;
    
    setFormData({
      ...formData,
      modules: checked ? allModules : []
    });
  };
  
  const columns = [
  {
    header: "Plan Name",
    field: "Plan_Name",
    body: (rowData) =>
    <h6 className="fw-medium">
          <Link to="#">{rowData.Plan_Name}</Link>
        </h6>,

    sortable: true
  },
  {
    header: "Plan Type",
    field: "Plan_Type",
    sortable: true
  },
  {
    header: "Total Subscribers",
    field: "Total_Subscribers",
    sortable: true
  },
  {
    header: "Price",
    field: "Price",
    sortable: true
  },
  {
    header: "Created Date",
    field: "Created_Date",
    sortable: true
  },
  {
    header: "Status",
    field: "Status",
    body: (rowData) =>
    <span className={`badge ${rowData.Status === 'Active' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {rowData.Status}
        </span>,

    sortable: true
  },
  {
    header: "",
    field: "actions",
    body: (rowData) =>
    <div className="action-icon d-inline-flex align-items-center">
          <Link
        to="#"
        className="p-2 d-flex align-items-center border rounded me-2"
        data-bs-toggle="modal"
        data-bs-target="#edit_plans"
        onClick={() => handleEditClick(rowData)}>
        
            <i className="ti ti-edit" />
          </Link>
          <Link
        to="#"
        data-bs-toggle="modal"
        data-bs-target="#delete_modal"
        className="p-2 d-flex align-items-center border rounded"
        onClick={() => setDeleteId(rowData.id || rowData.key)}>
        
            <i className="ti ti-trash" />
          </Link>
        </div>,

    sortable: false
  }];


  const planName = [
  { value: "Advanced", label: "Advanced" },
  { value: "Basic", label: "Basic" },
  { value: "Enterprise", label: "Enterprise" }];

  const planType = [
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" }];

  const planPosition = [
  { value: "1", label: "1" },
  { value: "2", label: "2" }];

  const plancurrency = [
  { value: "Fixed", label: "Fixed" },
  { value: "Percentage", label: "Percentage" }];

  const discountType = [
  { value: "Fixed", label: "Fixed" },
  { value: "Percentage", label: "Percentage" }];

  const status = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" }];

  return (
    <>
      <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Packages</h4>
                <h6>Manage your packages</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add_plans"
                className="btn btn-primary">
                
                <i className='ti ti-circle-plus me-1'></i>
                Add Packages
              </Link>
            </div>
          </div>

          <div className="row">
            {/* Total Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Total Plans
                      </p>
                      <h4>{String(stats.total).padStart(2, '0')}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-primary flex-shrink-0">
                      <i className="ti ti-box fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Total Plans */}
            {/* Total Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Active Plans
                      </p>
                      <h4>{String(stats.active).padStart(2, '0')}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-success flex-shrink-0">
                      <i className="ti ti-activity-heartbeat fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Total Plans */}
            {/* Inactive Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Inactive Plans
                      </p>
                      <h4>{stats.inactive}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-danger flex-shrink-0">
                      <i className="ti ti-player-pause fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Inactive Companies */}
            {/* No of Plans  */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        No of Plan Types
                      </p>
                      <h4>{String(stats.planTypes).padStart(2, '0')}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-skyblue flex-shrink-0">
                      <i className="ti ti-mask fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /No of Plans */}
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Plan List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
               
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">
                    
                    Select Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Inactive
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">
                    
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1">
                        
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className='table-responsive'>
                <PrimeDataTable
                  column={columns}
                  data={data}
                  totalRecords={totalRecords}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  rows={rows}
                  setRows={setRows}
                  selectionMode="checkbox"
                  selection={selectedPackages}
                  onSelectionChange={(e) => setSelectedPackages(e.value)}
                  dataKey="id"
                />
              </div>
            </div>
          </div>
        </div>
      {/* Add Plan */}
      <div className="modal fade" id="add_plans">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Plan</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetAddForm}>
                
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddPackage}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <img
                          src="assets/img/profiles/avatar-30.jpg"
                          alt="img"
                          className="rounded-circle" />
                        
                      </div>
                      <div className="profile-upload">
                        <div className="mb-2">
                          <h6 className="mb-1">Upload Profile Image</h6>
                          <p className="fs-12">Image should be below 4 mb</p>
                        </div>
                        <div className="profile-uploader d-flex align-items-center">
                          <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                            Upload
                            <input
                              type="file"
                              className="form-control image-sign"
                              multiple />
                            
                          </div>
                          <Link
                            to="#"
                            className="btn btn-light btn-sm">
                            
                            Cancel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Name<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose"
                        value={planName.find(opt => opt.value === addFormData.name) || null}
                        onChange={(selected) => setAddFormData({ ...addFormData, name: selected?.value || '' })}
                      />
                      {formErrors.name && <div className="text-danger small mt-1">{formErrors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Type<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose"
                        value={planType.find(opt => opt.value === addFormData.type) || null}
                        onChange={(selected) => setAddFormData({ ...addFormData, type: selected?.value || '' })}
                      />
                      {formErrors.type && <div className="text-danger small mt-1">{formErrors.type}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Position<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planPosition}
                        placeholder="Choose"
                        value={planPosition.find(opt => opt.value === addFormData.position) || null}
                        onChange={(selected) => setAddFormData({ ...addFormData, position: selected?.value || '' })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label">
                          Price<span className="text-danger"> *</span>
                        </label>
                        <span className="text-primary">
                          <i className="fa-solid fa-circle-exclamation me-2" />
                          Set 0 for free
                        </span>
                      </div>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={addFormData.price}
                        onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                      />
                      {formErrors.price && <div className="text-danger small mt-1">{formErrors.price}</div>}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount Type
                      </label>
                      <div className="pass-group">
                        <Select
                          classNamePrefix="react-select"
                          options={discountType}
                          placeholder="Choose"
                          value={discountType.find(opt => opt.value === addFormData.discountType) || null}
                          onChange={(selected) => setAddFormData({ ...addFormData, discountType: selected?.value || '' })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount
                      </label>
                      <div className="pass-group">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={addFormData.discount}
                          onChange={(e) => setAddFormData({ ...addFormData, discount: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Limitations Invoices</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={addFormData.maxInvoices}
                        onChange={(e) => setAddFormData({ ...addFormData, maxInvoices: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Customers</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={addFormData.maxCustomers}
                        onChange={(e) => setAddFormData({ ...addFormData, maxCustomers: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Products</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={addFormData.maxProducts}
                        onChange={(e) => setAddFormData({ ...addFormData, maxProducts: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Suppliers</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={addFormData.maxSuppliers}
                        onChange={(e) => setAddFormData({ ...addFormData, maxSuppliers: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6>Plan Modules</h6>
                      <div className="form-check d-flex align-items-center">
                        <label className="form-check-label mt-0 text-dark fw-medium">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={addFormData.modules.length === 16}
                            onChange={(e) => handleSelectAllModules(e.target.checked, 'add')}
                          />
                          Select All
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    {['Employees', 'Invoices', 'Reports', 'Contacts', 'Clients', 'Estimates', 'Goals', 'Deals', 'Projects', 'Payments', 'Assets', 'Leads', 'Tickets', 'Taxes', 'Activities', 'Pipelines'].map((module) => (
                      <div key={module} className="col-lg-3 col-sm-6">
                        <div className="form-check d-flex align-items-center mb-3">
                          <label className="form-check-label mt-0 text-dark fw-medium">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={addFormData.modules.includes(module)}
                              onChange={(e) => handleModuleChange(module, e.target.checked, 'add')}
                            />
                            {module}
                          </label>
                        </div>
                      </div>
                    ))}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <label className="form-check-label mt-0 me-2 text-dark fw-medium">
                          Access Trial
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            checked={addFormData.accessTrial}
                            onChange={(e) => setAddFormData({ ...addFormData, accessTrial: e.target.checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center gx-3">
                    <div className="col-md-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-fill">
                          <label className="form-label">Trial Days</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            min="0"
                            value={addFormData.trialDays}
                            onChange={(e) => setAddFormData({ ...addFormData, trialDays: e.target.value })}
                            disabled={!addFormData.accessTrial}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="d-block align-items-center ms-3">
                        <label className="form-check-label mt-0 me-2 text-dark">
                          Is Recommended
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            checked={addFormData.isRecommended}
                            onChange={(e) => setAddFormData({ ...addFormData, isRecommended: e.target.checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Status<span className="text-danger"> *</span>
                        </label>
                        <Select
                          classNamePrefix="react-select"
                          options={status}
                          placeholder="Choose"
                          value={status.find(opt => opt.value === addFormData.status) || null}
                          onChange={(selected) => setAddFormData({ ...addFormData, status: selected?.value || 'Active' })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={addFormData.description}
                        onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  disabled={formLoading}>
                  
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Plan */}
      {/* Edit Plan */}
      <div className="modal fade" id="edit_plans">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Plan</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdatePackage}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <img
                          src="assets/img/profiles/avatar-30.jpg"
                          alt="img"
                          className="rounded-circle" />
                        
                      </div>
                      <div className="profile-upload">
                        <div className="mb-2">
                          <h6 className="mb-1">Upload Profile Image</h6>
                          <p className="fs-12">Image should be below 4 mb</p>
                        </div>
                        <div className="profile-uploader d-flex align-items-center">
                          <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                            Upload
                            <input
                              type="file"
                              className="form-control image-sign"
                              multiple />
                            
                          </div>
                          <Link
                            to="#"
                            className="btn btn-light btn-sm">
                            
                            Cancel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Name<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose"
                        value={planName.find(opt => opt.value === editFormData.name) || null}
                        onChange={(selected) => setEditFormData({ ...editFormData, name: selected?.value || '' })}
                      />
                      {formErrors.name && <div className="text-danger small mt-1">{formErrors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Type<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose"
                        value={planType.find(opt => opt.value === editFormData.type) || null}
                        onChange={(selected) => setEditFormData({ ...editFormData, type: selected?.value || '' })}
                      />
                      {formErrors.type && <div className="text-danger small mt-1">{formErrors.type}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Position<span className="text-danger"> *</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planPosition}
                        placeholder="Choose"
                        value={planPosition.find(opt => opt.value === editFormData.position) || null}
                        onChange={(selected) => setEditFormData({ ...editFormData, position: selected?.value || '' })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label">
                          Price<span className="text-danger"> *</span>
                        </label>
                        <span className="text-primary">
                          <i className="fa-solid fa-circle-exclamation me-2" />
                          Set 0 for free
                        </span>
                      </div>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      />
                      {formErrors.price && <div className="text-danger small mt-1">{formErrors.price}</div>}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount Type
                      </label>
                      <div className="pass-group">
                        <Select
                          classNamePrefix="react-select"
                          options={discountType}
                          placeholder="Choose"
                          value={discountType.find(opt => opt.value === editFormData.discountType) || null}
                          onChange={(selected) => setEditFormData({ ...editFormData, discountType: selected?.value || '' })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Discount
                      </label>
                      <div className="pass-group">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={editFormData.discount}
                          onChange={(e) => setEditFormData({ ...editFormData, discount: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Limitations Invoices</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={editFormData.maxInvoices}
                        onChange={(e) => setEditFormData({ ...editFormData, maxInvoices: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Customers</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={editFormData.maxCustomers}
                        onChange={(e) => setEditFormData({ ...editFormData, maxCustomers: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Products</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={editFormData.maxProducts}
                        onChange={(e) => setEditFormData({ ...editFormData, maxProducts: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Max Suppliers</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={editFormData.maxSuppliers}
                        onChange={(e) => setEditFormData({ ...editFormData, maxSuppliers: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6>Plan Modules</h6>
                      <div className="form-check d-flex align-items-center">
                        <label className="form-check-label mt-0 text-dark fw-medium">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={editFormData.modules.length === 16}
                            onChange={(e) => handleSelectAllModules(e.target.checked, 'edit')}
                          />
                          Select All
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    {['Employees', 'Invoices', 'Reports', 'Contacts', 'Clients', 'Estimates', 'Goals', 'Deals', 'Projects', 'Payments', 'Assets', 'Leads', 'Tickets', 'Taxes', 'Activities', 'Pipelines'].map((module) => (
                      <div key={module} className="col-lg-3 col-sm-6">
                        <div className="form-check d-flex align-items-center mb-3">
                          <label className="form-check-label mt-0 text-dark fw-medium">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={editFormData.modules.includes(module)}
                              onChange={(e) => handleModuleChange(module, e.target.checked, 'edit')}
                            />
                            {module}
                          </label>
                        </div>
                      </div>
                    ))}
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-3">
                        <label className="form-check-label mt-0 me-2 text-dark fw-medium">
                          Access Trial
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            checked={editFormData.accessTrial}
                            onChange={(e) => setEditFormData({ ...editFormData, accessTrial: e.target.checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center gx-3">
                    <div className="col-md-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-fill">
                          <label className="form-label">Trial Days</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            min="0"
                            value={editFormData.trialDays}
                            onChange={(e) => setEditFormData({ ...editFormData, trialDays: e.target.value })}
                            disabled={!editFormData.accessTrial}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="d-block align-items-center ms-3">
                        <label className="form-check-label mt-0 me-2 text-dark">
                          Is Recommended
                        </label>
                        <div className="form-check form-switch me-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            checked={editFormData.isRecommended}
                            onChange={(e) => setEditFormData({ ...editFormData, isRecommended: e.target.checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="mb-3 ">
                        <label className="form-label">
                          Status<span className="text-danger"> *</span>
                        </label>
                        <Select
                          classNamePrefix="react-select"
                          options={status}
                          placeholder="Choose"
                          value={status.find(opt => opt.value === editFormData.status) || null}
                          onChange={(selected) => setEditFormData({ ...editFormData, status: selected?.value || 'Active' })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  disabled={formLoading}>
                  
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Plan */}
      <>
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="avatar avatar-xl bg-danger-transparent rounded-circle text-danger mb-3">
                  <i className="ti ti-trash-x fs-36" />
                </span>
                <h4 className="mb-1">Confirm Delete</h4>
                <p className="mb-3">
                  You want to delete all the marked items, this cant be undone once
                  you delete.
                </p>
                <div className="d-flex justify-content-center">
                  <Link
                    to="#"
                    className="btn btn-secondary me-3"
                    data-bs-dismiss="modal">
                    
                    Cancel
                  </Link>
                  <Link to="#" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleDeletePackage}>
                    Yes, Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
      </>

    </>);



};

export default Packages;