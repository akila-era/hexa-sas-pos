import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import ReactApexChart from "react-apexcharts";
import PrimeDataTable from "../components/data-table";
import TooltipIcons from "../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../components/tooltip-content/refresh";
import CollapesIcon from "../components/tooltip-content/collapes";
import CommonDateRangePicker from "../components/date-range-picker/common-date-range-picker";
import DeleteModal from "../components/delete-modal";
import { superAdminUsersService } from "../services/superadmin.service";

const SuperAdminUsers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [rows, setRows] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    status: 'Active'
  });
  const [deleteId, setDeleteId] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false
  });

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await superAdminUsersService.getAll({ page: currentPage, limit: rows });
      if (response?.success && response?.data) {
        const usersData = response.data;
        const transformedData = usersData.map((user, index) => ({
          key: user.id || String(index + 1),
          id: user.id,
          Email: user.email,
          FirstName: user.firstName || '',
          LastName: user.lastName || '',
          FullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          CreatedDate: new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          Status: user.isActive ? 'Active' : 'Inactive',
          Role: user.role?.name || 'Super Admin'
        }));
        setData(transformedData);
        setTotalRecords(response.pagination?.total || transformedData.length);
        
        // Calculate stats
        const active = transformedData.filter(u => u.Status === 'Active').length;
        const inactive = transformedData.filter(u => u.Status === 'Inactive').length;
        setStats({
          total: response.pagination?.total || transformedData.length,
          active,
          inactive
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rows]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change
  const handleSelectChange = (name, option) => {
    setFormData(prev => ({ ...prev, [name]: option ? option.value : '' }));
  };

  // Handle add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      const response = await superAdminUsersService.create({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isActive: formData.status === 'Active'
      });
      if (response?.success) {
        alert('User created successfully!');
        fetchUsers();
        setFormData({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', status: 'Active' });
        // Close modal
        const modal = document.getElementById('add_user');
        if (modal) {
          const bsModal = window.bootstrap?.Modal?.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  // Handle edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser?.id) return;
    try {
      const updateData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isActive: formData.status === 'Active'
      };
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        updateData.password = formData.password;
      }
      const response = await superAdminUsersService.update(selectedUser.id, updateData);
      if (response?.success) {
        alert('User updated successfully!');
        fetchUsers();
        // Close modal
        const modal = document.getElementById('edit_user');
        if (modal) {
          const bsModal = window.bootstrap?.Modal?.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteId) return;
    try {
      const response = await superAdminUsersService.delete(deleteId);
      if (response?.success) {
        alert('User deleted successfully!');
        fetchUsers();
        setDeleteId(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  // Handle view user
  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  // Handle edit click
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.Email,
      password: '',
      confirmPassword: '',
      firstName: user.FirstName,
      lastName: user.LastName,
      status: user.Status
    });
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field]
    }));
  };

  const statusChoose = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" }
  ];

  const columns = [
    {
      header: "Name",
      field: "FullName",
      body: (rowData) => (
        <div className="d-flex align-items-center file-name-icon">
          <div className="avatar avatar-md border rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2">
            <span>{rowData.FullName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{rowData.FullName}</Link>
            </h6>
            <p className="text-muted mb-0 fs-12">{rowData.Email}</p>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: "Email",
      field: "Email",
      sortable: true
    },
    {
      header: "Role",
      field: "Role",
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
      body: (rowData) => (
        <span className={`badge ${rowData.Status === "Active" ? "badge-success" : "badge-danger"} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {rowData.Status}
        </span>
      ),
      sortable: true
    },
    {
      header: "",
      field: "actions",
      body: (rowData) => (
        <div className="action-icon d-inline-flex align-items-center">
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded me-2"
            data-bs-toggle="modal"
            data-bs-target="#user_detail"
            onClick={() => handleViewUser(rowData)}
          >
            <i className="ti ti-eye" />
          </Link>
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_user"
            onClick={() => handleEditClick(rowData)}
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            className="p-2 d-flex align-items-center border rounded"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            onClick={() => setDeleteId(rowData.id || rowData.key)}
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
      sortable: false
    }
  ];

  // Chart configurations
  const [totalChart] = useState({
    series: [{ name: "Users", data: [25, 66, 41, 12, 36, 9, 21] }],
    fill: { type: "gradient", gradient: { opacityFrom: 0, opacityTo: 0 } },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: { show: false },
      zoom: { enabled: false },
      dropShadow: { top: 3, left: 14, blur: 4, opacity: 0.12, color: "#fff" },
      sparkline: { enabled: true }
    },
    markers: { size: 0, colors: ["#F26522"], strokeColors: "#fff", strokeWidth: 2, hover: { size: 7 } },
    plotOptions: { bar: { horizontal: false, columnWidth: "35%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2.5, curve: "smooth" },
    colors: ["#F26522"],
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    tooltip: { theme: "dark", fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => "" } }, marker: { show: false } }
  });

  const [activeChart] = useState({
    series: [{ name: "Active Users", data: [25, 40, 35, 20, 36, 9, 21] }],
    fill: { type: "gradient", gradient: { opacityFrom: 0, opacityTo: 0 } },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: { show: false },
      zoom: { enabled: false },
      dropShadow: { top: 3, left: 14, blur: 4, opacity: 0.12, color: "#fff" },
      sparkline: { enabled: true }
    },
    markers: { size: 0, colors: ["#F26522"], strokeColors: "#fff", strokeWidth: 2, hover: { size: 7 } },
    plotOptions: { bar: { horizontal: false, columnWidth: "35%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2.5, curve: "smooth" },
    colors: ["#F26522"],
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    tooltip: { theme: "dark", fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => "" } }, marker: { show: false } }
  });

  const [inactiveChart] = useState({
    series: [{ name: "Inactive Users", data: [25, 10, 35, 5, 25, 28, 21] }],
    fill: { type: "gradient", gradient: { opacityFrom: 0, opacityTo: 0 } },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 50,
      toolbar: { show: false },
      zoom: { enabled: false },
      dropShadow: { top: 3, left: 14, blur: 4, opacity: 0.12, color: "#fff" },
      sparkline: { enabled: true }
    },
    markers: { size: 0, colors: ["#F26522"], strokeColors: "#fff", strokeWidth: 2, hover: { size: 7 } },
    plotOptions: { bar: { horizontal: false, columnWidth: "35%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2.5, curve: "smooth" },
    colors: ["#F26522"],
    xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] },
    tooltip: { theme: "dark", fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => "" } }, marker: { show: false } }
  });

  return (
    <>
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Super Admin Users</h4>
              <h6>Manage your super admin users</h6>
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
              data-bs-target="#add_user">
              <i className="ti ti-circle-plus me-1"></i> Add User
            </Link>
          </div>
        </div>

        <div className="row">
          {/* Total Users */}
          <div className="col-lg-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar avatar-lg bg-primary flex-shrink-0">
                    <i className="ti ti-users fs-16" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="fs-12 fw-medium mb-1 text-truncate">Total Users</p>
                    <h4>{stats.total}</h4>
                  </div>
                </div>
                <ReactApexChart
                  options={totalChart}
                  series={totalChart.series}
                  type="area"
                  width={50}
                />
              </div>
            </div>
          </div>
          {/* /Total Users */}
          {/* Active Users */}
          <div className="col-lg-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar avatar-lg bg-success flex-shrink-0">
                    <i className="ti ti-user-check fs-16" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="fs-12 fw-medium mb-1 text-truncate">Active Users</p>
                    <h4>{stats.active}</h4>
                  </div>
                </div>
                <ReactApexChart
                  options={activeChart}
                  series={activeChart.series}
                  type="area"
                  width={50}
                />
              </div>
            </div>
          </div>
          {/* /Active Users */}
          {/* Inactive Users */}
          <div className="col-lg-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center overflow-hidden">
                  <span className="avatar avatar-lg bg-danger flex-shrink-0">
                    <i className="ti ti-user-x fs-16" />
                  </span>
                  <div className="ms-2 overflow-hidden">
                    <p className="fs-12 fw-medium mb-1 text-truncate">Inactive Users</p>
                    <h4>{stats.inactive}</h4>
                  </div>
                </div>
                <ReactApexChart
                  options={inactiveChart}
                  series={inactiveChart.series}
                  type="area"
                  width={50}
                />
              </div>
            </div>
          </div>
          {/* /Inactive Users */}
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h5>Users List</h5>
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
                  Select Status
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">Active</Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">Inactive</Link>
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
                selection={selectedUsers}
                onSelectionChange={(e) => setSelectedUsers(e.value)}
                dataKey="id"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add User */}
      <div className="modal fade" id="add_user">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New User</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Password <span className="text-danger">*</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.password ? "text" : "password"}
                          className="pass-input form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`}
                          onClick={() => togglePasswordVisibility("password")}>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.confirmPassword ? "text" : "password"}
                          className="pass-input form-control"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                          onClick={() => togglePasswordVisibility("confirmPassword")}>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
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
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add User */}

      {/* Edit User */}
      <div className="modal fade" id="edit_user">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit User</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Password (Leave blank to keep current)</label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.password ? "text" : "password"}
                          className="pass-input form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`}
                          onClick={() => togglePasswordVisibility("password")}>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.confirmPassword ? "text" : "password"}
                          className="pass-input form-control"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                          onClick={() => togglePasswordVisibility("confirmPassword")}>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
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
      {/* /Edit User */}

      {/* User Detail */}
      <div className="modal fade" id="user_detail">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">User Detail</h4>
              <button
                type="button"
                className="btn-close custom-btn-close p-0"
                data-bs-dismiss="modal"
                aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="moday-body">
              <div className="p-3">
                {selectedUser && (
                  <div className="d-flex justify-content-between align-items-center rounded bg-light p-3">
                    <div className="file-name-icon d-flex align-items-center">
                      <div className="avatar avatar-md border rounded-circle flex-shrink-0 me-2 bg-primary text-white d-flex align-items-center justify-content-center">
                        <span>{selectedUser.FullName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-gray-9 fw-medium mb-0">{selectedUser.FullName}</p>
                        <p>{selectedUser.Email}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="row align-items-center mt-3">
                  {selectedUser && (
                    <>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="fs-12 mb-0">First Name</p>
                          <p className="text-gray-9">{selectedUser.FirstName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="fs-12 mb-0">Last Name</p>
                          <p className="text-gray-9">{selectedUser.LastName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="fs-12 mb-0">Email</p>
                          <p className="text-gray-9">{selectedUser.Email}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="fs-12 mb-0">Role</p>
                          <p className="text-gray-9">{selectedUser.Role}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="fs-12 mb-0">Created Date</p>
                          <p className="text-gray-9">{selectedUser.CreatedDate}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="fs-12 mb-0">Status</p>
                          <p className="text-gray-9">
                            <span className={`badge ${selectedUser.Status === "Active" ? "badge-success" : "badge-danger"}`}>
                              {selectedUser.Status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light me-2"
                data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /User Detail */}

      {/* Delete Modal */}
      <DeleteModal
        id="delete_modal"
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onDelete={handleDeleteUser}
      />
    </>
  );
};

export default SuperAdminUsers;
