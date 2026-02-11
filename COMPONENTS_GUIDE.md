# Reusable Components Guide

## Overview
This directory contains reusable UI components that reduce code duplication across the application and ensure consistent design patterns.

## Component Catalog

### Form Components

#### FormInput
**Purpose:** Standardized text input with label, validation, and error display.

**Props:**
- `label` (string, required) - Input label
- `required` (boolean) - Shows asterisk for required fields
- `error` (string) - Error message to display
- All standard TextInput props

**Usage:**
```tsx
<FormInput
  label="Product Name"
  required
  placeholder="Enter product name"
  value={name}
  onChangeText={setName}
  error={nameError}
/>
```

**Replaces:** ~15 lines of label + TextInput + error display per instance
**Used in:** AddEditProductScreen, BillScreen (8+ instances)

---

#### SearchBar
**Purpose:** Consistent search input with icon and clear button.

**Props:**
- `value` (string, required) - Current search value
- `onChangeText` (function, required) - Handler for text changes
- `placeholder` (string) - Placeholder text (default: "Search...")
- `onClear` (function) - Custom clear handler

**Usage:**
```tsx
<SearchBar 
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search products..."
/>
```

**Replaces:** ~12 lines of search UI per instance
**Used in:** ProductsListScreen, SelectProductScreen, CustomerAnalyticsScreen, StockScreen (7+ instances)

---

### Layout Components

#### ScreenHeader
**Purpose:** Consistent screen header with back button, title, and optional actions.

**Props:**
- `title` (string, required) - Header title
- `subtitle` (string) - Optional subtitle
- `onBack` (function) - Back button handler
- `rightActions` (ReactNode) - Custom right-side actions
- `showBackButton` (boolean) - Show/hide back button (default: true)

**Usage:**
```tsx
<ScreenHeader 
  title="Product Details"
  subtitle="Last updated: Today"
  onBack={() => navigation.goBack()}
  rightActions={
    <TouchableOpacity onPress={handleEdit}>
      <Icon name="edit" size={24} />
    </TouchableOpacity>
  }
/>
```

**Replaces:** ~30-35 lines of header layout per instance
**Used in:** ProductDetailsScreen, CustomerDetailsScreen, InvoiceHistoryScreen (8+ instances)

---

#### BottomSheetModal
**Purpose:** Reusable bottom sheet modal with consistent overlay and animations.

**Props:**
- `visible` (boolean, required) - Modal visibility
- `onClose` (function, required) - Close handler
- `title` (string, required) - Modal title
- `children` (ReactNode, required) - Modal content
- `maxHeight` (number | string) - Max height (default: "80%")

**Usage:**
```tsx
<BottomSheetModal
  visible={showFilterModal}
  onClose={() => setShowFilterModal(false)}
  title="Sort & Filter"
  maxHeight="85%"
>
  {/* Your filter content */}
</BottomSheetModal>
```

**Replaces:** ~40-50 lines of modal boilerplate per instance
**Used in:** ProductsListScreen (2 modals), SelectProductScreen, BillScreen (2 modals), StockScreen (10+ instances)

---

#### ChipButton
**Purpose:** Single chip-style button for categories, filters, or tags.

**Props:**
- `label` (string, required) - Button label
- `active` (boolean) - Active state styling
- `onPress` (function, required) - Press handler
- `icon` (string) - Optional icon name
- `style` (ViewStyle) - Custom styles

**Usage:**
```tsx
<ChipButton
  label="Electronics"
  active={category === 'Electronics'}
  onPress={() => setCategory('Electronics')}
  icon="check"
/>
```

**Replaces:** ~20-25 lines per chip button
**Used in:** ProductsListScreen, SelectProductScreen, CustomerAnalyticsScreen (15+ instances)

---

#### ChipGroup
**Purpose:** Group of chip buttons with selection management.

**Props:**
- `options` (Array<{label, value}>, required) - Chip options
- `selectedValue` (string, required) - Currently selected value
- `onSelect` (function, required) - Selection handler
- `horizontal` (boolean) - Horizontal scrolling (default: true)

**Usage:**
```tsx
<ChipGroup 
  options={[
    { label: 'All', value: 'all' },
    { label: 'In Stock', value: 'in-stock' },
    { label: 'Low Stock', value: 'low' }
  ]}
  selectedValue={stockFilter}
  onSelect={setStockFilter}
/>
```

**Replaces:** ~15-20 lines of ScrollView + mapped chips
**Used in:** ProductsListScreen, SelectProductScreen (5+ instances)

---

#### MetricCard
**Purpose:** Display metric with label, value, optional icon and subtitle.

**Props:**
- `label` (string, required) - Metric label
- `value` (string | number, required) - Metric value
- `color` (string) - Value text color
- `icon` (ReactNode) - Optional icon
- `subtitle` (string) - Optional subtitle

**Usage:**
```tsx
<MetricCard
  label="Total Revenue"
  value="$1,234.56"
  color={Colors.success}
  icon={<Icon name="trending-up" size={24} color={Colors.success} />}
  subtitle="↑ 12% from last month"
/>
```

**Replaces:** ~15-20 lines of metric display
**Used in:** DashboardScreen, CustomerDetailsScreen, ProductDetailsScreen (20+ instances)

---

## Code Reduction Summary

### Total Lines Saved
- **SearchBar**: 7 instances × 12 lines = **~84 lines**
- **BottomSheetModal**: 10 instances × 45 lines = **~450 lines**
- **FormInput**: 8 instances × 15 lines = **~120 lines**
- **ScreenHeader**: 8 instances × 32 lines = **~256 lines**
- **ChipButton/ChipGroup**: 5 instances × 18 lines = **~90 lines**
- **MetricCard**: 10 instances × 17 lines = **~170 lines**

**Total Duplicate Code Removed: ~1,170 lines**

### Benefits
1. **Consistency**: All screens use the same UI patterns
2. **Maintainability**: Single source of truth for each pattern
3. **Type Safety**: Proper TypeScript interfaces for all props
4. **Accessibility**: Centralized improvements benefit all screens
5. **Testing**: Test once, works everywhere
6. **Performance**: Optimized components reused throughout app

---

## Component Architecture

```
components/
├── index.ts                    # Centralized exports
├── FormComponents
│   ├── FormInput.tsx          # Label + TextInput + validation
│   └── SearchBar.tsx          # Search input with icon
├── LayoutComponents
│   ├── ScreenHeader.tsx       # Screen header with back button
│   ├── BottomSheetModal.tsx   # Bottom sheet modal wrapper
│   ├── ChipButton.tsx         # Single chip button
│   ├── ChipGroup.tsx          # Group of chips
│   └── MetricCard.tsx         # Metric display card
└── BaseComponents
    ├── Button.tsx
    ├── Card.tsx
    ├── Typography.tsx
    ├── Icon.tsx
    └── ...
```

---

## Best Practices

### When to Create a Component
1. Pattern appears 3+ times across codebase
2. UI element has consistent structure and behavior
3. Component can be parameterized with props
4. Reduces code duplication by 10+ lines per instance

### Component Guidelines
1. **Props over Configuration**: Use props for customization
2. **Composition over Monoliths**: Small, focused components
3. **TypeScript First**: Strong typing for all props
4. **Style Props**: Allow style customization via props
5. **Accessibility**: Include proper ARIA labels and roles

### Import Pattern
```tsx
// Named imports from index
import { SearchBar, FormInput, ScreenHeader } from '../../components';

// Or individual imports
import SearchBar from '../../components/SearchBar';
```

---

## Migration Guide

### Replacing SearchBar Pattern
**Before:**
```tsx
<View style={styles.searchBar}>
  <Icon name="search" size={20} />
  <TextInput
    style={styles.searchInput}
    placeholder="Search..."
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
  {searchQuery.length > 0 && (
    <TouchableOpacity onPress={() => setSearchQuery('')}>
      <Icon name="close" size={20} />
    </TouchableOpacity>
  )}
</View>
```

**After:**
```tsx
<SearchBar 
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search..."
/>
```

### Replacing Modal Pattern
**Before:**
```tsx
<Modal visible={show} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShow(false)} />
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Typography variant="h3">Title</Typography>
        <TouchableOpacity onPress={() => setShow(false)}>
          <Icon name="close" size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView>{/* content */}</ScrollView>
    </View>
  </View>
</Modal>
```

**After:**
```tsx
<BottomSheetModal visible={show} onClose={() => setShow(false)} title="Title">
  {/* content */}
</BottomSheetModal>
```

---

## Future Components

Potential candidates for componentization:
- **TabBar**: Custom tab navigation component
- **Dropdown**: Reusable dropdown selector
- **DatePicker**: Consistent date selection
- **ImagePicker**: Standardized image upload
- **LoadingState**: Consistent loading indicators
- **ErrorBoundary**: Error handling wrapper

---

## Testing

Each component should have:
1. Unit tests for logic
2. Snapshot tests for UI
3. Integration tests for user interactions
4. Accessibility tests

Example:
```tsx
// FormInput.test.tsx
describe('FormInput', () => {
  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <FormInput label="Name" error="Required field" value="" onChangeText={() => {}} />
    );
    expect(getByText('Required field')).toBeTruthy();
  });
});
```
