# OMS Frontend Integration Guide

## Overview
This guide explains how to integrate the Order Management System (OMS) into the frontend with conditional rendering based on feature flags.

## Files Created

### Services
- `reactjs/template/src/services/oms.service.js` - OMS API service
- `reactjs/template/src/services/feature-toggle.service.js` - Feature toggle API service

### Components
- `reactjs/template/src/feature-module/oms/Orders.jsx` - OMS Orders list page

### Hooks
- `reactjs/template/src/hooks/useFeatureFlag.js` - React hook for checking feature flags

## Integration Steps

### 1. Add Routes to path.jsx

Add the OMS routes to `reactjs/template/src/routes/path.jsx`:

```javascript
import OmsOrders from '../feature-module/oms/Orders';

// Add to authRoutes array
{
  id: 200,
  path: routes.omsOrders,
  name: "oms-orders",
  element: <OmsOrders />,
  route: Route
},
```

### 2. Add to Sidebar (Conditional)

Update `reactjs/template/src/core/json/siderbar_data.js` to conditionally show OMS menu:

```javascript
import { useOMSEnabled } from '../../hooks/useFeatureFlag';

// In your sidebar component or data structure
{
  label: "Order Management",
  icon: 'shopping-cart',
  link: routes.omsOrders,
  // Only show if OMS is enabled
  // You'll need to check this dynamically in your sidebar component
}
```

### 3. Conditional Route Rendering

In your main router component, conditionally render OMS routes:

```javascript
import { useOMSEnabled } from './hooks/useFeatureFlag';

function AppRoutes() {
  const { isEnabled: omsEnabled, loading } = useOMSEnabled();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Other routes */}
      
      {/* Only render OMS routes if feature is enabled */}
      {omsEnabled && (
        <>
          <Route path={routes.omsOrders} element={<OmsOrders />} />
          {/* Add more OMS routes as needed */}
        </>
      )}
      
      {/* Fallback for disabled feature */}
      {!omsEnabled && (
        <Route 
          path="/oms/*" 
          element={
            <div className="page-wrapper">
              <div className="content">
                <div className="alert alert-warning">
                  <h4>Module Not Enabled</h4>
                  <p>The Order Management System is not enabled for your account. Please contact your administrator.</p>
                </div>
              </div>
            </div>
          } 
        />
      )}
    </Routes>
  );
}
```

### 4. Error Handling

The OMS service automatically handles feature disabled errors. When a user tries to access OMS routes without the feature enabled, they'll see:

- **Backend**: Returns 403 with error code `FEATURE_DISABLED`
- **Frontend**: Shows error message and can redirect to dashboard

### 5. Super Admin Feature Toggle UI

For super admin users, you can add a feature toggle interface in the Companies page or create a dedicated page:

```javascript
import { featureToggleService } from '../services/feature-toggle.service';

// In your super admin component
const handleToggleOMS = async (tenantId) => {
  try {
    await featureToggleService.toggleFeature(tenantId, 'OMS');
    toast.success('OMS feature toggled successfully');
    // Refresh tenant list
  } catch (error) {
    toast.error('Failed to toggle feature');
  }
};
```

## Usage Examples

### Check Feature in Component

```javascript
import { useOMSEnabled } from '../hooks/useFeatureFlag';

function MyComponent() {
  const { isEnabled, loading } = useOMSEnabled();

  if (loading) return <div>Loading...</div>;
  if (!isEnabled) return <div>OMS not available</div>;

  return <div>OMS Content</div>;
}
```

### Direct API Call

```javascript
import { featureToggleService } from '../services/feature-toggle.service';

// Check if OMS is enabled
const checkOMS = async () => {
  const tenantId = getCurrentTenantId();
  const enabled = await featureToggleService.checkOMSEnabled(tenantId);
  return enabled;
};
```

## Best Practices

1. **Always check feature flag before rendering OMS routes**
2. **Show user-friendly messages when feature is disabled**
3. **Handle loading states when checking feature flags**
4. **Cache feature flag status to avoid repeated API calls**
5. **Update feature flag status after super admin toggles**

## Testing

1. **Test with feature disabled**: Verify routes are hidden/blocked
2. **Test with feature enabled**: Verify routes work correctly
3. **Test super admin toggle**: Verify feature can be enabled/disabled
4. **Test error handling**: Verify graceful error messages

## Notes

- Feature flag checks are done client-side for UX, but backend enforces security
- Backend middleware (`featureGuard`) ensures features cannot be bypassed
- Frontend checks are for UX only - never rely on them for security

