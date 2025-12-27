// Export all services from a single entry point

// Auth & User Management
export { authService, getStoredUser, isAuthenticated } from './auth.service';
export { companyService } from './company.service';

// Products & Inventory
export { productService } from './product.service';
export { brandService } from './brand.service';
export { unitService } from './unit.service';
export { categoryService } from './category.service';
export { variantAttributeService } from './variant-attribute.service';
export { warrantyService } from './warranty.service';
export { barcodeService } from './barcode.service';

// Sales & POS
export { posService } from './pos.service';
export { saleService } from './sale.service';
export { default as onlineOrderService } from './online-order.service';
export { salesReturnService } from './sales-return.service';
export { quotationService } from './quotation.service';
export { invoiceService } from './invoice.service';

// Stock & Warehouse
export { stockService } from './stock.service';
export { warehouseService } from './warehouse.service';

// Purchases
export { purchaseService } from './purchase.service';
export { purchaseReturnService } from './purchase-return.service';
export { supplierService } from './supplier.service';

// Customers
export { customerService } from './customer.service';
export { default as billerService } from './biller.service';

// HRM
export { employeeService } from './employee.service';
export { departmentService } from './department.service';
export { designationService } from './designation.service';
export { shiftService } from './shift.service';
export { attendanceService } from './attendance.service';
export { leaveService } from './leave.service';
export { leaveTypeService } from './leave-type.service';
export { holidayService } from './holiday.service';
export { payrollService } from './payroll.service';

// Finance
export { accountService } from './account.service';
export { expenseService } from './expense.service';
export { incomeService } from './income.service';
export { moneyTransferService } from './money-transfer.service';

// Promo
export { default as couponService } from './coupon.service';
export { default as giftCardService } from './gift-card.service';
export { default as discountPlanService } from './discount-plan.service';
export { default as discountService } from './discount.service';

// Settings & Reports
export { settingsService } from './settings.service';
export { reportService } from './report.service';
