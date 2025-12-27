import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { DatePicker } from "antd";
import ReactApexChart from "react-apexcharts";
import Select from "react-select";
import { companies_details } from "../core/json/companiesdetails";
import PrimeDataTable from "../components/data-table";

import TooltipIcons from "../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../components/tooltip-content/refresh";
import CollapesIcon from "../components/tooltip-content/collapes";
import CommonDateRangePicker from "../components/date-range-picker/common-date-range-picker";
import { companiesService } from "../services/superadmin.service";


const Companies = () => {
  const [data, setData] = useState(companies_details);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 950, active: 920, inactive: 30, locations: 180 });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [rows, setRows] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(data.length);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', accountUrl: '', phone: '', website: '', password: '', 
    confirmPassword: '', address: '', plan: 'FREE', planType: '', currency: 'USD', language: 'English', status: 'Active'
  });
  const [deleteId, setDeleteId] = useState(null);

  // Fetch companies from API
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await companiesService.getAll({ page: currentPage, limit: rows });
      if (response?.success && response?.data) {
        const companiesData = response.data.companies || response.data;
        
        // Verify inactive tenants are included (Super Admin should see all tenants)
        const activeCount = companiesData.filter(c => c.isActive === true).length;
        const inactiveCount = companiesData.filter(c => c.isActive === false).length;
        console.log('Companies fetched - Active:', activeCount, 'Inactive:', inactiveCount, 'Total:', companiesData.length);
        
        // Transform data to match UI format
        const transformedData = companiesData.map((company, index) => {
          const status = company.isActive ? 'Active' : 'Inactive';
          // Log inactive tenants for verification
          if (!company.isActive) {
            console.log(`Inactive tenant found: ${company.name} (ID: ${company.id}) - Status: ${status}`);
          }
          return {
            key: company.id || String(index + 1),
            id: company.id,
            CompanyName: company.name,
            Email: company.email || `user${index}@example.com`,
            AccountURL: company.accountUrl || `${company.name?.toLowerCase().replace(/\s/g, '')}.example.com`,
            Plan: company.plan || 'FREE',
            CreatedDate: new Date(company.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            Image: `company-${(index % 10) + 1}.svg`,
            Status: status
          };
        });
        setData(transformedData);
        setTotalRecords(response.data.total || transformedData.length);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Keep using mock data if API fails
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await companiesService.getStats();
      if (response?.success && response?.data) {
        setStats({
          total: response.data.totalCompanies || 950,
          active: response.data.activeCompanies || 920,
          inactive: response.data.inactiveCompanies || 30,
          locations: response.data.locations || 180
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchStats();
  }, [fetchCompanies, fetchStats]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Select change
  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption?.value || '' }));
  };

  // Handle add company
  const handleAddCompany = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || formData.name.trim() === '') {
      alert('Company name is required');
      return;
    }

    try {
      const companyData = {
        name: formData.name.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        accountUrl: formData.accountUrl?.trim() || undefined,
        currency: formData.currency || 'USD',
        language: formData.language || 'English',
        plan: formData.plan || 'FREE',
        isActive: formData.status === 'Active' || formData.status === '' || !formData.status ? true : false,
        password: formData.password?.trim() || undefined
      };

      // Validate password if provided
      if (formData.password && formData.password.length > 0) {
        if (formData.password.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
      }

      const response = await companiesService.create(companyData);
      if (response?.success) {
        // Log company account creation
        console.log('Company account created successfully:', {
          timestamp: new Date().toISOString(),
          companyData: {
            name: companyData.name,
            email: companyData.email,
            accountUrl: companyData.accountUrl,
            phone: companyData.phone,
            website: companyData.website,
            plan: companyData.plan,
            currency: companyData.currency,
            language: companyData.language,
            status: companyData.isActive ? 'Active' : 'Inactive',
            hasPassword: !!companyData.password
          },
          response: {
            id: response?.data?.id,
            success: response?.success
          }
        });
        
        // Close modal using Bootstrap
        const modalElement = document.getElementById('add_company');
        if (modalElement) {
          const modalInstance = window.bootstrap?.Modal?.getInstance(modalElement);
          if (modalInstance) {
            modalInstance.hide();
          } else {
            // Fallback: use jQuery if Bootstrap Modal API not available
            const $modal = window.$?.fn?.modal ? window.$(modalElement) : null;
            if ($modal) {
              $modal.modal('hide');
            }
          }
        }
        
        // Reset form
        setFormData({ 
          name: '', email: '', accountUrl: '', phone: '', website: '', password: '', 
          confirmPassword: '', address: '', plan: 'FREE', planType: '', currency: 'USD', language: 'English', status: 'Active' 
        });
        
        // Refresh companies list
        await fetchCompanies();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error adding company:', error);
      alert(error?.message || 'Failed to add company. Please try again.');
    }
  };

  // Handle edit company
  const handleEditCompany = async (e) => {
    e.preventDefault();
    if (!selectedCompany?.id) return;
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        accountUrl: formData.accountUrl,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        plan: formData.plan,
        currency: formData.currency,
        language: formData.language,
        isActive: formData.status === 'Active'
      };
      
      const response = await companiesService.update(selectedCompany.id, updateData);
      if (response?.success) {
        // Close modal
        const modalElement = document.getElementById('edit_company');
        if (modalElement) {
          const modalInstance = window.bootstrap?.Modal?.getInstance(modalElement);
          if (modalInstance) {
            modalInstance.hide();
          } else {
            const $modal = window.$?.fn?.modal ? window.$(modalElement) : null;
            if ($modal) {
              $modal.modal('hide');
            }
          }
        }
        
        // Refresh companies list and stats
        await fetchCompanies();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error updating company:', error);
      alert(error?.error?.message || error?.message || 'Failed to update company. Please try again.');
    }
  };

  // Handle delete company
  const handleDeleteCompany = async () => {
    if (!deleteId) return;
    try {
      const response = await companiesService.delete(deleteId);
      if (response?.success) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  // Handle activate/deactivate company (toggle status)
  const handleToggleCompanyStatus = async (companyId, currentStatus) => {
    try {
      const response = await companiesService.getById(companyId);
      if (response?.success && response?.data) {
        const companyData = response.data;
        const updateData = {
          ...companyData,
          isActive: !currentStatus
        };
        
        const updateResponse = await companiesService.update(companyId, updateData);
        if (updateResponse?.success) {
          await fetchCompanies();
          await fetchStats();
        }
      }
    } catch (error) {
      console.error('Error toggling company status:', error);
      alert(error?.error?.message || error?.message || 'Failed to update company status. Please try again.');
    }
  };

  // Handle view company
  const handleViewCompany = async (company) => {
    setSelectedCompany(company);
    
    // Fetch full company details if we have the ID
    if (company.id) {
      try {
        const response = await companiesService.getById(company.id);
        if (response?.success && response?.data) {
          const companyData = response.data;
          setFormData({
            name: companyData.name || company.CompanyName,
            email: companyData.email || company.Email,
            accountUrl: companyData.accountUrl || company.AccountURL,
            phone: companyData.phone || '',
            website: companyData.website || '',
            address: companyData.address || '',
            plan: companyData.plan || company.Plan?.split(' ')[0] || 'FREE',
            currency: companyData.currency || 'USD',
            language: companyData.language || 'English',
            status: companyData.isActive ? 'Active' : 'Inactive',
            planType: companyData.planType || '', 
            password: '', 
            confirmPassword: ''
          });
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
        // Fallback to basic data from table row
        setFormData({
          name: company.CompanyName,
          email: company.Email,
          accountUrl: company.AccountURL,
          plan: company.Plan?.split(' ')[0] || 'FREE',
          status: company.Status,
          phone: '', 
          website: '', 
          password: '', 
          confirmPassword: '', 
          address: '', 
          planType: '', 
          currency: 'USD', 
          language: 'English'
        });
      }
    } else {
      // Fallback to basic data from table row
      setFormData({
        name: company.CompanyName,
        email: company.Email,
        accountUrl: company.AccountURL,
        plan: company.Plan?.split(' ')[0] || 'FREE',
        status: company.Status,
        phone: '', 
        website: '', 
        password: '', 
        confirmPassword: '', 
        address: '', 
        planType: '', 
        currency: 'USD', 
        language: 'English'
      });
    }
  };

  // Handle edit click
  const handleEditClick = async (company) => {
    setSelectedCompany(company);
    
    // Fetch full company details if we have the ID
    if (company.id) {
      try {
        const response = await companiesService.getById(company.id);
        if (response?.success && response?.data) {
          const companyData = response.data;
          setFormData({
            name: companyData.name || company.CompanyName,
            email: companyData.email || company.Email,
            accountUrl: companyData.accountUrl || company.AccountURL,
            phone: companyData.phone || '',
            website: companyData.website || '',
            address: companyData.address || '',
            plan: companyData.plan || company.Plan?.split(' ')[0] || 'FREE',
            currency: companyData.currency || 'USD',
            language: companyData.language || 'English',
            status: companyData.isActive ? 'Active' : 'Inactive',
            planType: '', password: '', confirmPassword: ''
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      }
    }
    
    // Fallback to basic data from table row
    setFormData({
      name: company.CompanyName,
      email: company.Email,
      accountUrl: company.AccountURL,
      plan: company.Plan?.split(' ')[0] || 'FREE',
      status: company.Status,
      phone: '', website: '', password: '', confirmPassword: '', address: '', planType: '', currency: 'USD', language: 'English'
    });
  };
  
  const columns = [
  {
    header: "Company Name",
    field: "CompanyName",
    body: (rowData) =>
    <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border rounded-circle">
            <img
          src={`/src/assets/img/company/${rowData.Image}`}
          className="img-fluid"
          alt="img" 
          onError={(e) => {
            e.target.src = '/src/assets/img/company/company-01.svg';
          }} />
        
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{rowData.CompanyName}</Link>
            </h6>
          </div>
        </div>,

    sortable: true
  },
  {
    header: "Email",
    field: "Email",
    sortable: true
  },
  {
    header: "Account URL",
    field: "AccountURL",
    sortable: true
  },
  {
    header: "Plan",
    field: "Plan",
    body: (rowData) =>
    <div className="d-flex align-items-center justify-content-between">
          <p className="mb-0 me-2">{rowData.Plan}</p>
          <Link
        to="#"
        data-bs-toggle="modal"
        className="badge badge-purple badge-xs"
        data-bs-target="#upgrade_info">
        
            Upgrade
          </Link>
        </div>,

    sortable: true
  },
  {
    header: "Created Date",
    field: "CreatedDate",
    sortable: true
  },
  {
    header: "Status",
    field: "Status",
    body: (rowData) =>
    <span
      className={`badge ${
      rowData.Status === "Active" ? "badge-success" : "badge-danger"} d-inline-flex align-items-center badge-xs`
      }>
      
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
        data-bs-target="#company_detail"
        onClick={() => handleViewCompany(rowData)}>
        
            <i className="ti ti-eye" />
          </Link>
          <Link
        to="#"
        className="p-2 d-flex align-items-center border rounded me-2"
        data-bs-toggle="modal"
        data-bs-target="#edit_company"
        onClick={() => handleEditClick(rowData)}>
        
            <i className="ti ti-edit" />
          </Link>
          <Link
        to="#"
        className="p-2 d-flex align-items-center border rounded"
        data-bs-toggle="modal"
        data-bs-target="#delete_modal"
        onClick={() => setDeleteId(rowData.id || rowData.key)}>
        
            <i className="ti ti-trash" />
          </Link>
        </div>,

    sortable: false
  }];

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false
  });

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field]
    }));
  };

  const planName = [
  { value: "Advanced", label: "Advanced" },
  { value: "Basic", label: "Basic" },
  { value: "Enterprise", label: "Enterprise" }];

  const planType = [
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" }];

  const currency = [
  { value: "USD", label: "USD" },
  { value: "Euro", label: "Euro" }];

  const language = [
  { value: "English", label: "English" },
  { value: "Arabic", label: "Arabic" }];

  const statusChoose = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" }];


  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  const [totalChart] = useState({
    series: [
    {
      name: "Messages",
      data: [25, 66, 41, 12, 36, 9, 21]
    }],

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0, // Start with 0 opacity (transparent)
        opacityTo: 0 // End with 0 opacity (transparent)
      }
    },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: !1
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth"
    },
    colors: ["#F26522"],
    xaxis: {
      categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep"]

    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },
      y: {
        title: {
          formatter: function () {
            return "";
          }
        }
      },
      marker: {
        show: !1
      }
    }
  });
  const [activeChart] = useState({
    series: [
    {
      name: "Active Company",
      data: [25, 40, 35, 20, 36, 9, 21]
    }],

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0, // Start with 0 opacity (transparent)
        opacityTo: 0 // End with 0 opacity (transparent)
      }
    },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: !1
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth"
    },
    colors: ["#F26522"],
    xaxis: {
      categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep"]

    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },
      y: {
        title: {
          formatter: function () {
            return "";
          }
        }
      },
      marker: {
        show: !1
      }
    }
  });
  const [inactiveChart] = useState({
    series: [
    {
      name: "Inactive Company",
      data: [25, 10, 35, 5, 25, 28, 21]
    }],

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0, // Start with 0 opacity (transparent)
        opacityTo: 0 // End with 0 opacity (transparent)
      }
    },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: !1
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth"
    },
    colors: ["#F26522"],
    xaxis: {
      categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep"]

    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },
      y: {
        title: {
          formatter: function () {
            return "";
          }
        }
      },
      marker: {
        show: !1
      }
    }
  });
  const [locationChart] = useState({
    series: [
    {
      name: "Inactive Company",
      data: [30, 40, 15, 23, 20, 23, 25]
    }],

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0, // Start with 0 opacity (transparent)
        opacityTo: 0 // End with 0 opacity (transparent)
      }
    },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#F26522"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: !1
    },
    stroke: {
      show: !0,
      width: 2.5,
      curve: "smooth"
    },
    colors: ["#F26522"],
    xaxis: {
      categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep"]

    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },
      y: {
        title: {
          formatter: function () {
            return "";
          }
        }
      },
      marker: {
        show: !1
      }
    }
  });

  return (
    <>
      <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Companies</h4>
                <h6>Manage your companies</h6>
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
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_company">
                
                <i className="ti ti-circle-plus me-1"></i> Add Company
              </Link>
            </div>
          </div>

          <div className="row">
            {/* Total Companies */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-primary flex-shrink-0">
                      <i className="ti ti-building fs-16" />
                    </span>
<div className="ms-2 overflow-hidden">
                                      <p className="fs-12 fw-medium mb-1 text-truncate">
                                        Total Companies
                                      </p>
                                      <h4>{stats.total}</h4>
                                    </div>
                  </div>
                  <ReactApexChart
                    options={totalChart}
                    series={totalChart.series}
                    type="area"
                    width={50} />
                  
                </div>
              </div>
            </div>
            {/* /Total Companies */}
            {/* Total Companies */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-success flex-shrink-0">
                      <i className="ti ti-building fs-16" />
                    </span>
<div className="ms-2 overflow-hidden">
                                      <p className="fs-12 fw-medium mb-1 text-truncate">
                                        Active Companies
                                      </p>
                                      <h4>{stats.active}</h4>
                                    </div>
                  </div>
                  <ReactApexChart
                    options={activeChart}
                    series={activeChart.series}
                    type="area"
                    width={50} />
                  
                </div>
              </div>
            </div>
            {/* /Total Companies */}
            {/* Inactive Companies */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-danger flex-shrink-0">
                      <i className="ti ti-building fs-16" />
                    </span>
<div className="ms-2 overflow-hidden">
                                      <p className="fs-12 fw-medium mb-1 text-truncate">
                                        Inactive Companies
                                      </p>
                                      <h4>{stats.inactive}</h4>
                                    </div>
                  </div>
                  <ReactApexChart
                    options={inactiveChart}
                    series={inactiveChart.series}
                    type="area"
                    width={50} />
                  
                </div>
              </div>
            </div>
            {/* /Inactive Companies */}
            {/* Company Location */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-skyblue flex-shrink-0">
                      <i className="ti ti-map-pin-check fs-16" />
                    </span>
<div className="ms-2 overflow-hidden">
                                      <p className="fs-12 fw-medium mb-1 text-truncate">
                                        Company Location
                                      </p>
                                      <h4>{stats.locations}</h4>
                                    </div>
                  </div>
                  <ReactApexChart
                    options={locationChart}
                    series={locationChart.series}
                    type="area"
                    width={50} />
                  
                </div>
              </div>
            </div>
            {/* /Company Location */}
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Companies List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                    <CommonDateRangePicker />
                    <span className="input-icon-addon">
                      <i className="ti ti-chevron-down" />
                    </span>
                  </div>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">
                    
                    Select Plan
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Advanced
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Basic
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Enterprise
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">
                    
                    Select Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
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
                      <Link to="#" className="dropdown-item rounded-1">
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={data}
                  totalRecords={totalRecords}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  rows={rows}
                  setRows={setRows}
                  selectionMode="checkbox"
                  selection={selectedCompanies}
                  onSelectionChange={(e) => setSelectedCompanies(e.value)}
                  dataKey="id"
                />
              </div>
            </div>
          </div>
        </div>
      {/* Add Company */}
      <div className="modal fade" id="add_company">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Company</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddCompany}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <i className="ti ti-photo" />
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
                          <Link to="#" className="btn btn-secondary btn-sm">
                            Cancel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Name <span className="text-danger"> *</span>
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Account URL</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="accountUrl"
                        value={formData.accountUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Website</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">Password (Optional)</label>
                      <div className="pass-group">
                        <input
                          type={
                          passwordVisibility.password ? "text" : "password"
                          }
                          className="pass-input form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                        
                        <span
                          className={`ti toggle-passwords ${
                          passwordVisibility.password ?
                          "ti-eye" :
                          "ti-eye-off"}`
                          }
                          onClick={() => togglePasswordVisibility("password")}>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">Confirm Password (Optional)</label>
                      <div className="pass-group">
                        <input
                          type={
                          passwordVisibility.confirmPassword ?
                          "text" :
                          "password"
                          }
                          className="pass-input form-control"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                        />
                        
                        <span
                          className={`ti toggle-passwords ${
                          passwordVisibility.confirmPassword ?
                          "ti-eye" :
                          "ti-eye-off"}`
                          }
                          onClick={() =>
                          togglePasswordVisibility("confirmPassword")
                          }>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Name
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose"
                        value={planName.find(opt => opt.value === formData.plan) || null}
                        onChange={(option) => handleSelectChange('plan', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Type
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose"
                        value={planType.find(opt => opt.value === formData.planType) || null}
                        onChange={(option) => handleSelectChange('planType', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Currency
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={currency}
                        placeholder="Choose"
                        value={currency.find(opt => opt.value === formData.currency) || null}
                        onChange={(option) => handleSelectChange('currency', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Language
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={language}
                        placeholder="Choose"
                        value={language.find(opt => opt.value === formData.language) || null}
                        onChange={(option) => handleSelectChange('language', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3 ">
                      <label className="form-label">Status</label>
                      <Select
                        classNamePrefix="react-select"
                        options={statusChoose}
                        placeholder="Choose"
                        value={statusChoose.find(opt => opt.value === formData.status) || null}
                        onChange={(option) => handleSelectChange('status', option)}
                      />
                      
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal">
                  
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary">
                  
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Company */}
      {/* Edit Company */}
      <div className="modal fade" id="edit_company">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Company</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditCompany}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                      <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                        <i className="ti ti-photo" />
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
                          <Link to="#" className="btn btn-secondary btn-sm">
                            Cancel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Name <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Account URL</label>
                      <input
                        type="text"
                        className="form-control"
                        name="accountUrl"
                        value={formData.accountUrl}
                        onChange={handleInputChange}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Website</label>
                      <input
                        type="text"
                        className="form-control"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">Plan Name</label>
                      <Select
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose"
                        value={planName.find(opt => opt.value === formData.plan) || null}
                        onChange={(option) => handleSelectChange('plan', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">Plan Type</label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose"
                        value={planType.find(opt => opt.value === formData.planType) || null}
                        onChange={(option) => handleSelectChange('planType', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3 ">
                      <label className="form-label">Currency</label>
                      <Select
                        classNamePrefix="react-select"
                        options={currency}
                        placeholder="Choose"
                        value={currency.find(opt => opt.value === formData.currency) || null}
                        onChange={(option) => handleSelectChange('currency', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3 ">
                      <label className="form-label">Language</label>
                      <Select
                        classNamePrefix="react-select"
                        options={language}
                        placeholder="Choose"
                        value={language.find(opt => opt.value === formData.language) || null}
                        onChange={(option) => handleSelectChange('language', option)}
                      />
                      
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3 ">
                      <label className="form-label">Status</label>
                      <Select
                        classNamePrefix="react-select"
                        options={statusChoose}
                        placeholder="Choose"
                        value={statusChoose.find(opt => opt.value === formData.status) || null}
                        onChange={(option) => handleSelectChange('status', option)}
                      />
                      
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal">
                  
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary">
                  
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Company */}
      {/* Upgrade Information */}
      <div className="modal fade" id="upgrade_info">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Upgrade Package</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="p-3 mb-1">
              <div className="rounded bg-light p-3">
                <h5 className="mb-3">Current Plan Details</h5>
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-12 mb-0">Company Name</p>
                      <p className="text-gray-9">BrightWave Innovations</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-12 mb-0">Plan Name</p>
                      <p className="text-gray-9">Advanced</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-12 mb-0">Plan Type</p>
                      <p className="text-gray-9">Monthly</p>
                    </div>
                  </div>
                </div>
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-12 mb-0">Price</p>
                      <p className="text-gray-9">200</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-12 mb-0">Register Date</p>
                      <p className="text-gray-9">12 Sep 2024</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-12 mb-0">Expiring On</p>
                      <p className="text-gray-9">11 Oct 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <form action="companies.html">
              <div className="modal-body pb-0">
                <h5 className="mb-4">Change Plan</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Name <span className="text-danger">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planName}
                        placeholder="Choose" />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 ">
                      <label className="form-label">
                        Plan Type <span className="text-danger">*</span>
                      </label>
                      <Select
                        classNamePrefix="react-select"
                        options={planType}
                        placeholder="Choose" />
                      
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Ammount<span className="text-danger">*</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Payment Date <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask"
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY" />
                        
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Next Payment Date <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask"
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY" />
                        
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Expiring On <span className="text-danger">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask"
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY" />
                        
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal">
                  
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary">
                  
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Upgrade Information */}
      {/* Company Detail */}
      <div className="modal fade" id="company_detail">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Company Detail</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              {selectedCompany ? (
                <>
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-center rounded bg-light p-3">
                      <div className="file-name-icon d-flex align-items-center">
                        <Link
                          to="#"
                          className="avatar avatar-md border rounded-circle flex-shrink-0 me-2">
                          
                          <img
                            src={`src/assets/img/company/${selectedCompany.Image || 'company-01.svg'}`}
                            className="img-fluid"
                            alt="img" />
                          
                        </Link>
                        <div>
                          <p className="text-gray-9 fw-medium mb-0">
                            {selectedCompany.CompanyName || 'N/A'}
                          </p>
                          <p>{selectedCompany.Email || 'N/A'}</p>
                        </div>
                      </div>
                      <span className={`badge ${selectedCompany.Status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        <i className="ti ti-point-filled" />
                        {selectedCompany.Status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-gray-9 fw-medium">Basic Info</p>
                    <div className="pb-1 border-bottom mb-4">
                      <div className="row align-items-center">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Account URL</p>
                            <p className="text-gray-9">{selectedCompany.AccountURL || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Phone Number</p>
                            <p className="text-gray-9">{formData.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Website</p>
                            <p className="text-gray-9">{formData.website || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="row align-items-center">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Currency</p>
                            <p className="text-gray-9">
                              {formData.currency === 'USD' ? 'United States Dollar (USD)' : formData.currency === 'Euro' ? 'Euro (EUR)' : formData.currency || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Language</p>
                            <p className="text-gray-9">{formData.language || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Address</p>
                            <p className="text-gray-9">
                              {formData.address || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-9 fw-medium">Plan Details</p>
                    <div>
                      <div className="row align-items-center">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Plan Name</p>
                            <p className="text-gray-9">{selectedCompany.Plan || formData.plan || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Plan Type</p>
                            <p className="text-gray-9">{formData.planType || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <p className="fs-12 mb-0">Created Date</p>
                            <p className="text-gray-9">{selectedCompany.CreatedDate || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 text-center">
                  <p>No company selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* /Company Detail */}
      <>
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="avatar avatar-xl bg-danger-transparent rounded-circle text-danger mb-3">
                  <i className="ti ti-trash-x fs-36" />
                </span>
                <h4 className="mb-1">Confirm Delete</h4>
                <p className="mb-3">
                  You want to delete all the marked items, this cant be undone
                  once you delete.
                </p>
<div className="d-flex justify-content-center">
                                  <Link
                                    to="#"
                                    className="btn btn-secondary me-3"
                                    data-bs-dismiss="modal">
                                    
                                    Cancel
                                  </Link>
                                  <Link
                                    to="#"
                                    className="btn btn-primary"
                                    data-bs-dismiss="modal"
                                    onClick={handleDeleteCompany}>
                                    
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

export default Companies;