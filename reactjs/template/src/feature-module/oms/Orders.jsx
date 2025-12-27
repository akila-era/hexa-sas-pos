import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import { all_routes } from "../../routes/all_routes";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import CommonSelect from "../../components/select/common-select";
import SearchFromApi from "../../components/data-table/search";
import { omsService } from "../../services/oms.service";
import { productService } from "../../services/product.service";
import DeleteModal from "../../components/delete-modal";

const OmsOrders = () => {
  const route = all_routes;
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [statusNote, setStatusNote] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedProduct, setScannedProduct] = useState(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    loadOrders();
  }, [currentPage, rows, searchQuery, selectedStatus, selectedPaymentStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: rows,
        search: searchQuery || undefined,
        status: selectedStatus?.value || undefined,
        paymentStatus: selectedPaymentStatus?.value || undefined,
      };

      const response = await omsService.getAll(params);
      
      if (response.success) {
        setListData(response.data || []);
        setTotalRecords(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setListData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedOrderForStatus || !newStatus) return;
    
    try {
      await omsService.update(selectedOrderForStatus.id, { 
        status: newStatus.value,
        note: statusNote 
      });
      
      // Close modal
      const modal = document.getElementById('change-status-modal');
      if (modal) {
        const bsModal = window.bootstrap?.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      }
      
      // Reset form
      setSelectedOrderForStatus(null);
      setNewStatus(null);
      setStatusNote("");
      
      // Reload orders
      loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  const openStatusChangeModal = (order) => {
    setSelectedOrderForStatus(order);
    setNewStatus({ value: order.status, label: getStatusLabel(order.status) });
    setStatusNote("");
    
    // Open modal using Bootstrap
    const modalElement = document.getElementById('change-status-modal');
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancel = async () => {
    if (!orderToCancel) return;
    
    try {
      await omsService.delete(orderToCancel.id, cancelReason || "Cancelled by user");
      
      // Close modal
      const modal = document.getElementById('cancel-order-modal');
      if (modal) {
        const bsModal = window.bootstrap?.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      }
      
      // Reset form
      setOrderToCancel(null);
      setCancelReason("");
      
      // Reload orders
      loadOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelReason("");
    
    // Open modal using Bootstrap
    const modalElement = document.getElementById('cancel-order-modal');
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: "bg-warning", label: "Pending" },
      CONFIRMED: { class: "bg-info", label: "Confirmed" },
      PROCESSING: { class: "bg-primary", label: "Processing" },
      READY: { class: "bg-success", label: "Ready" },
      DELIVERED: { class: "bg-success", label: "Delivered" },
      CANCELLED: { class: "bg-danger", label: "Cancelled" },
    };

    const config = statusConfig[status] || { class: "bg-secondary", label: status };

    return (
      <span className={`${config.class} fs-10 text-white p-1 rounded`}>
        <i className="ti ti-point-filled me-1" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const config = {
      PAID: { class: "bg-success", label: "Paid" },
      PARTIAL: { class: "bg-warning", label: "Partial" },
      UNPAID: { class: "bg-danger", label: "Unpaid" },
    };

    const paymentConfig = config[paymentStatus] || { class: "bg-secondary", label: paymentStatus };

    return (
      <span className={`${paymentConfig.class} fs-10 text-white p-1 rounded`}>
        {paymentConfig.label}
      </span>
    );
  };

  const columns = [
    {
      header: "Order Number",
      field: "orderNumber",
      sorter: (a, b) => a.orderNumber?.localeCompare(b.orderNumber || "") || 0
    },
    {
      header: "Customer",
      field: "customerName",
      body: (text) => (
        <div className="d-flex align-items-center">
          <Link to="#">{text.customerName || "Walk-in Customer"}</Link>
        </div>
      ),
      sorter: (a, b) => (a.customerName || "").localeCompare(b.customerName || "")
    },
    {
      header: "Status",
      field: "status",
      body: (text) => getStatusBadge(text.status),
      sorter: (a, b) => a.status?.localeCompare(b.status || "") || 0
    },
    {
      header: "Payment Status",
      field: "paymentStatus",
      body: (text) => getPaymentStatusBadge(text.paymentStatus),
      sorter: (a, b) => a.paymentStatus?.localeCompare(b.paymentStatus || "") || 0
    },
    {
      header: "Total",
      field: "total",
      body: (text) => `$${Number(text.total || 0).toFixed(2)}`,
      sorter: (a, b) => (a.total || 0) - (b.total || 0)
    },
    {
      header: "Date",
      field: "date",
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    },
    {
      header: "",
      field: "action",
      body: (text) => (
        <div className="edit-delete-action d-flex align-items-center">
              <Link
                className="me-2 edit-icon p-2 border d-flex align-items-center rounded"
                to={`${route.omsOrderDetails?.replace(':id', text.id) || '#'}`}
                title="View Order"
              >
                <i className="feather icon-eye action-eye" />
              </Link>
              <Link
                className="me-2 p-2 border d-flex align-items-center rounded"
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  openStatusChangeModal(text);
                }}
                data-bs-toggle="modal"
                data-bs-target="#change-status-modal"
                title="Change Status"
              >
                <i className="feather icon-edit feather-edit" />
              </Link>
              <Link
                className="me-2 p-2 border d-flex align-items-center rounded btn-info text-white"
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  const barcode = prompt(`Scan barcode for order ${text.orderNumber} to update status:`);
                  if (barcode) {
                    handleStatusUpdateByBarcode(text.id, barcode);
                  }
                }}
                title="Scan Barcode to Update Status"
              >
                <i className="feather icon-scan" />
              </Link>
          {text.status !== 'CANCELLED' && text.status !== 'DELIVERED' && (
            <>
              <Link
                className="p-2 d-flex align-items-center border rounded text-danger"
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  openCancelModal(text);
                }}
                data-bs-toggle="modal"
                data-bs-target="#cancel-order-modal"
                title="Cancel Order"
              >
                <i className="feather icon-trash-2" />
              </Link>
            </>
          )}
        </div>
      ),
      sorter: false
    }
  ];

  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "READY", label: "Ready" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const paymentStatusOptions = [
    { value: null, label: "All Payment Status" },
    { value: "PAID", label: "Paid" },
    { value: "PARTIAL", label: "Partial" },
    { value: "UNPAID", label: "Unpaid" },
  ];

  const statusChangeOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "READY", label: "Ready" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      PROCESSING: "Processing",
      READY: "Ready",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return statusMap[status] || status;
  };

  // Handle barcode scanning
  const handleBarcodeScan = async (barcode) => {
    if (!barcode || barcode.trim() === "") return;

    try {
      setBarcodeLoading(true);
      setScannedProduct(null);

      const response = await productService.findByBarcode(barcode.trim());
      
      if (response.success && response.data) {
        setScannedProduct(response.data);
        // Auto-focus back to input for next scan
        setTimeout(() => {
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
      setScannedProduct(null);
      alert("Product not found with this barcode. Please try again.");
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleBarcodeInputChange = (e) => {
    const value = e.target.value;
    setBarcodeInput(value);
    
    // Auto-submit when Enter is pressed or barcode is complete
    if (value.length >= 3 && (e.key === 'Enter' || e.keyCode === 13)) {
      handleBarcodeScan(value);
      setBarcodeInput("");
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput);
      setBarcodeInput("");
    }
  };

  // Update order status by scanning barcode (for delivery/ready status)
  const handleStatusUpdateByBarcode = async (orderId, scannedBarcode) => {
    try {
      // If barcode matches order number, update status
      const order = listData.find(o => o.orderNumber === scannedBarcode);
      if (order && order.id === orderId) {
        // Auto-update to READY if currently PROCESSING
        if (order.status === 'PROCESSING') {
          await omsService.update(orderId, { 
            status: 'READY',
            note: 'Status updated via barcode scan'
          });
          loadOrders();
          alert("Order status updated to READY");
        } else if (order.status === 'READY') {
          await omsService.update(orderId, { 
            status: 'DELIVERED',
            note: 'Status updated via barcode scan'
          });
          loadOrders();
          alert("Order status updated to DELIVERED");
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-header">
                <h4 className="fw-bold">Order Management</h4>
                <h6>Manage your orders</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#barcode-scan-modal"
              >
                <i className="feather icon-plus-circle me-1" />
                Scan Barcode
              </Link>
            </div>
          </div>
          {/* /order list */}
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows} />
              
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    to="#;"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">
                    Status
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    {statusOptions.map((option) => (
                      <li key={option.value || 'all'}>
                        <Link
                          to="#;"
                          className="dropdown-item rounded-1"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedStatus(option.value ? { value: option.value, label: option.label } : null);
                            setCurrentPage(1);
                          }}
                        >
                          {option.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#;"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown">
                    Payment Status
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    {paymentStatusOptions.map((option) => (
                      <li key={option.value || 'all'}>
                        <Link
                          to="#;"
                          className="dropdown-item rounded-1"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedPaymentStatus(option.value ? { value: option.value, label: option.label } : null);
                            setCurrentPage(1);
                          }}
                        >
                          {option.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={listData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords}
                  loading={loading}
                />
              </div>
            </div>
          </div>
          {/* /order list */}
        </div>
        <CommonFooter />
      </div>
      
      {/* Change Status Modal */}
      <div className="modal fade" id="change-status-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-header">
                    <h4>Change Order Status</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => {
                      setSelectedOrderForStatus(null);
                      setNewStatus(null);
                      setStatusNote("");
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="modal-top">
                      <div className="row">
                        <div className="col-12">
                          <div className="input-blocks">
                            <label>
                              Order Number
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedOrderForStatus?.orderNumber || ""}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="input-blocks">
                            <label>
                              Current Status
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={selectedOrderForStatus ? getStatusLabel(selectedOrderForStatus.status) : ""}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="input-blocks">
                            <label>
                              New Status
                              <span className="ms-1 text-danger">*</span>
                            </label>
                            <CommonSelect
                              className="w-100"
                              options={statusChangeOptions}
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.value ? { value: e.value, label: e.label } : null)}
                              placeholder="Choose Status"
                              filter={false}
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="input-blocks">
                            <label>Note (Optional)</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                              placeholder="Add a note about this status change..."
                            />
                            <p className="mt-1">Maximum 500 Characters</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-btns">
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="modal-footer-btn">
                            <button
                              type="button"
                              className="btn btn-cancel me-2 p-2 px-3"
                              data-bs-dismiss="modal"
                              onClick={() => {
                                setSelectedOrderForStatus(null);
                                setNewStatus(null);
                                setStatusNote("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-submit p-2 px-3"
                              onClick={(e) => {
                                e.preventDefault();
                                handleStatusChange();
                              }}
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Change Status Modal */}
      
      {/* Cancel Order Modal */}
      <div className="modal fade" id="cancel-order-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-header">
                    <h4>Cancel Order</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => {
                      setOrderToCancel(null);
                      setCancelReason("");
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="modal-top">
                      <div className="row">
                        <div className="col-12">
                          <div className="input-blocks">
                            <label>
                              Order Number
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={orderToCancel?.orderNumber || ""}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="input-blocks">
                            <label>
                              Cancel Reason
                              <span className="ms-1 text-danger">*</span>
                            </label>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Enter reason for cancellation..."
                              required
                            />
                            <p className="mt-1">Please provide a reason for cancelling this order</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-btns">
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="modal-footer-btn">
                            <button
                              type="button"
                              className="btn btn-cancel me-2 p-2 px-3"
                              data-bs-dismiss="modal"
                              onClick={() => {
                                setOrderToCancel(null);
                                setCancelReason("");
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-submit p-2 px-3"
                              onClick={(e) => {
                                e.preventDefault();
                                if (!cancelReason.trim()) {
                                  alert("Please enter a cancel reason");
                                  return;
                                }
                                handleCancel();
                              }}
                            >
                              Confirm Cancellation
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Cancel Order Modal */}
      
      {/* Barcode Scan Modal */}
      <div className="modal fade" id="barcode-scan-modal">
        <div className="modal-dialog modal-md modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Scan Barcode</h5>
              <button
                type="button"
                className="close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setBarcodeInput("");
                  setScannedProduct(null);
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <form onSubmit={handleBarcodeSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Enter or Scan Barcode</label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    className="form-control"
                    placeholder="Scan barcode or enter manually"
                    value={barcodeInput}
                    onChange={handleBarcodeInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeSubmit(e);
                      }
                    }}
                    autoFocus
                  />
                  <p className="mt-1 text-muted fs-12">
                    <i className="feather icon-info me-1" />
                    Press Enter or scan barcode to search
                  </p>
                </div>

                {barcodeLoading && (
                  <div className="text-center p-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Searching product...</p>
                  </div>
                )}

                {scannedProduct && !barcodeLoading && (
                  <div className="card bg-light shadow-none border-0 mb-0">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="fs-14 fw-semibold mb-1">{scannedProduct.name}</h6>
                          <p className="fs-12 mb-1">SKU: {scannedProduct.sku}</p>
                          <p className="fs-13 fw-semibold mb-0">${Number(scannedProduct.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="text-end">
                          <span className="badge badge-success">Found</span>
                        </div>
                      </div>
                      {scannedProduct.category && (
                        <p className="fs-12 text-muted mt-2 mb-0">
                          Category: {scannedProduct.category.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!scannedProduct && !barcodeLoading && barcodeInput && (
                  <div className="alert alert-warning">
                    <i className="feather icon-alert-circle me-1" />
                    No product found. Try scanning again or enter barcode manually.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={() => {
                    setBarcodeInput("");
                    setScannedProduct(null);
                  }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!barcodeInput.trim() || barcodeLoading}
                >
                  {barcodeLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Barcode Scan Modal */}
      
      {/* Delete Modal */}
      <DeleteModal />
    </div>
  );
};

export default OmsOrders;

