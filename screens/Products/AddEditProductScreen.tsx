import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Product } from '../../models';
import { ProductService, CategoryService } from '../../services';
import { Typography, Icon, Button, Card, FormInput, BottomSheetModal } from "../../components";
import { Colors } from "../../constants/colors";
import { Spacing } from "../../constants/spacing";
import { widthScale, heightScale, mediumScale } from '../../constants/size';

export default function AddEditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const product = (route.params as any)?.product;
  const isEditMode = !!product;
  const [permission, requestPermission] = useCameraPermissions();

  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "");
  const [buyingPrice, setBuyingPrice] = useState(
    product?.buyingPrice?.toString() || "",
  );
  const [sellingPrice, setSellingPrice] = useState(
    product?.sellingPrice?.toString() || "",
  );
  const [currentStock, setCurrentStock] = useState(
    product?.currentStock?.toString() || "",
  );
  const [minStock, setMinStock] = useState(product?.minStock?.toString() || "");
  const [criticalStock, setCriticalStock] = useState(
    product?.criticalStock?.toString() || "",
  );
  const [sku, setSku] = useState(product?.sku || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [description, setDescription] = useState(product?.description || "");
  const [image, setImage] = useState(product?.image || null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const loadedCategories = await CategoryService.getAll();
    setCategories(loadedCategories);
  };

  const handleCategorySelect = (cat: string) => {
    if (cat === "Other") {
      setShowCategoryPicker(false);
      setShowNewCategoryInput(true);
    } else {
      setCategory(cat);
      setShowCategoryPicker(false);
    }
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    if (categories.includes(trimmedName)) {
      Alert.alert("Error", "This category already exists");
      return;
    }

    const success = await CategoryService.save(trimmedName);
    if (success) {
      setCategory(trimmedName);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      loadCategories();
    } else {
      Alert.alert("Error", "Failed to create category");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant permission to access your photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant permission to access your camera.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleImagePicker = () => {
    setShowImagePicker(true);
  };

  const handleTakePhoto = () => {
    setShowImagePicker(false);
    setTimeout(takePhoto, 100);
  };

  const handlePickImage = () => {
    setShowImagePicker(false);
    setTimeout(pickImage, 100);
  };

  const handleRemoveImage = () => {
    setShowImagePicker(false);
    setImage("");
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setBarcode(data);
    setShowScanner(false);
    Alert.alert('Barcode Scanned', `Barcode: ${data}`);
    setTimeout(() => setScanned(false), 2000);
  };

  const handleOpenScanner = async () => {
    if (!permission || !permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan barcodes');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Error", "Please enter product name");
      return;
    }
    if (!category) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!buyingPrice || isNaN(parseFloat(buyingPrice))) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }
    if (
      !sellingPrice ||
      isNaN(parseFloat(sellingPrice)) ||
      parseFloat(sellingPrice) < parseFloat(buyingPrice)
    ) {
      Alert.alert("Error", "Please enter a valid selling price");
      return;
    }
    if (!currentStock || isNaN(parseInt(currentStock))) {
      Alert.alert("Error", "Please enter a valid stock quantity");
      return;
    }

    // Create product object
    const productData = {
      id: product?.id || Date.now().toString(),
      name: name.trim(),
      category,
      buyingPrice: parseFloat(buyingPrice),
      sellingPrice: parseFloat(sellingPrice),
      currentStock: parseInt(currentStock),
      minStock: minStock ? parseInt(minStock) : 10,
      criticalStock: criticalStock ? parseInt(criticalStock) : 5,
      sku: sku.trim(),
      barcode: barcode.trim(),
      description: description.trim(),
      image,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      soldUnits: product?.soldUnits || 0,
      revenue: product?.revenue || 0,
      profit: product?.profit || 0,
    };

    const success = await ProductService.save(productData);

    if (success) {
      Alert.alert(
        "Success",
        `Product ${isEditMode ? "updated" : "added"} successfully!`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } else {
      Alert.alert("Error", "Failed to save product. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <Typography variant="h2">
          {isEditMode ? "Edit Product" : "Add Product"}
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Product Image
          </Typography>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handleImagePicker}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="camera" size={40} />
                <Typography
                  variant="body"
                  color={Colors.textLight}
                  style={styles.imageText}
                >
                  Add Photo
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {/* Basic Information */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Basic Information
          </Typography>

          <FormInput
            label="Product Name"
            required
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.inputGroup}>
            <Typography variant="body" style={styles.label}>
              Category *
            </Typography>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Typography
                variant="body"
                color={category ? Colors.textPrimary : Colors.textLight}
              >
                {category || "Select category"}
              </Typography>
              <Icon name="chevron-down" size={20} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.pickerOptions}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.pickerOption}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Typography
                      variant="body"
                      color={
                        category === cat ? Colors.primary : Colors.textPrimary
                      }
                    >
                      {cat}
                    </Typography>
                    {category === cat && (
                      <Icon name="check" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.pickerOption, styles.otherOption]}
                  onPress={() => handleCategorySelect("Other")}
                >
                  <Typography variant="body" color={Colors.primary}>
                    + Add New Category
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showNewCategoryInput && (
            <View style={styles.inputGroup}>
              <Typography variant="body" style={styles.label}>
                New Category Name *
              </Typography>
              <View style={styles.newCategoryContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Enter category name"
                  placeholderTextColor={Colors.textLight}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />
                <View style={styles.newCategoryActions}>
                  <TouchableOpacity
                    style={styles.categoryActionBtn}
                    onPress={handleCreateCategory}
                  >
                    <Icon name="check" size={20} color={Colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryActionBtn}
                    onPress={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName("");
                    }}
                  >
                    <Icon name="close" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <FormInput
            label="Description"
            placeholder="Enter product description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </Card>

        {/* Pricing & Stock */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Pricing & Stock
          </Typography>

          <View style={styles.row}>
            <FormInput
              label="Buying Price"
              required
              placeholder="0.00"
              value={buyingPrice}
              onChangeText={setBuyingPrice}
              keyboardType="decimal-pad"
              style={styles.halfInput}
            />

            <View style={{ width: Spacing.md }} />

            <FormInput
              label="Selling Price"
              required
              placeholder="0.00"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="decimal-pad"
              style={styles.halfInput}
            />
          </View>

          <FormInput
            label="Current Stock"
            required
            placeholder="0"
            value={currentStock}
            onChangeText={setCurrentStock}
            keyboardType="number-pad"
          />

          <View style={styles.row}>
            <FormInput
              label="Min Stock"
              placeholder="10"
              value={minStock}
              onChangeText={setMinStock}
              keyboardType="number-pad"
              style={styles.halfInput}
            />

            <View style={{ width: Spacing.md }} />

            <FormInput
              label="Critical Stock"
              placeholder="5"
              value={criticalStock}
              onChangeText={setCriticalStock}
              keyboardType="number-pad"
              style={styles.halfInput}
            />
          </View>
        </Card>

        {/* Additional Details */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Additional Details
          </Typography>

          <FormInput
            label="SKU"
            placeholder="Enter SKU code"
            value={sku}
            onChangeText={setSku}
          />

          <View style={styles.inputGroup}>
            <Typography variant="body" style={styles.label}>
              Barcode
            </Typography>
            <View style={styles.barcodeInput}>
              <TextInput
                style={[styles.input, { marginBottom: 0, flex: 1 }]}
                placeholder="Enter or scan barcode"
                placeholderTextColor={Colors.textLight}
                value={barcode}
                onChangeText={setBarcode}
              />
              <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}>
                <Icon name="barcode-scan" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ flex: 1 }}
        />
        <Button
          title={isEditMode ? "Update Product" : "Add Product"}
          onPress={handleSave}
          style={{ flex: 1 }}
        />
      </View>

      {/* Barcode Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" transparent>
        <View style={styles.scannerModal}>
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
              }}
            />
            <TouchableOpacity
              style={styles.closeScannerButton}
              onPress={() => {
                setShowScanner(false);
                setScanned(false);
              }}
            >
              <Icon name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal visible={showImagePicker} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowImagePicker(false)}
        >
          <View style={styles.imagePickerModal}>
            <TouchableOpacity 
              style={styles.imageOption} 
              onPress={handleTakePhoto}
            >
              <Icon name="camera" size={24} color={Colors.primary} />
              <Typography variant="body" style={styles.imageOptionText}>
                Take Photo
              </Typography>
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity 
              style={styles.imageOption} 
              onPress={handlePickImage}
            >
              <Icon name="image" size={24} color={Colors.primary} />
              <Typography variant="body" style={styles.imageOptionText}>
                Choose from Gallery
              </Typography>
            </TouchableOpacity>

            {image && (
              <>
                <View style={styles.optionDivider} />
                <TouchableOpacity 
                  style={styles.imageOption} 
                  onPress={handleRemoveImage}
                >
                  <Icon name="delete" size={24} color={Colors.danger} />
                  <Typography variant="body" color={Colors.danger} style={styles.imageOptionText}>
                    Remove Image
                  </Typography>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.optionDivider} />

            <TouchableOpacity 
              style={styles.imageOption} 
              onPress={() => setShowImagePicker(false)}
            >
              <Typography variant="body" style={styles.cancelText}>
                Cancel
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingTop: heightScale(60),
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.background,
  },
  backButton: {
    padding: Spacing.xs,
  },
  section: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  imagePicker: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: mediumScale(12),
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    marginTop: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
    padding: Spacing.md,
    fontSize: mediumScale(16),
    color: Colors.textPrimary,
    borderWidth: mediumScale(1),
    borderColor: Colors.background,
  },
  textArea: {
    height: heightScale(100),
    textAlignVertical: "top",
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
    padding: Spacing.md,
    borderWidth: mediumScale(1),
    borderColor: Colors.background,
  },
  pickerOptions: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: mediumScale(8),
    borderWidth: mediumScale(1),
    borderColor: Colors.background,
    overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.background,
  },
  otherOption: {
    borderBottomWidth: 0,
  },
  newCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  newCategoryActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  categoryActionBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
  },
  row: {
    flexDirection: "row",
  },
  halfInput: {
    flex: 1,
  },
  barcodeInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  scanButton: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
  },
  bottomActions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: mediumScale(1),
    borderTopColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: heightScale(-2) },
    shadowOpacity: 0.1,
    shadowRadius: mediumScale(4),
    elevation: 5,
  },
  scannerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    width: '90%',
    height: '60%',
    borderRadius: mediumScale(12),
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  closeScannerButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.overlayLight,
    borderRadius: mediumScale(20),
    padding: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: mediumScale(20),
    borderTopRightRadius: mediumScale(20),
    paddingVertical: Spacing.md,
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  imageOptionText: {
    flex: 1,
  },
  optionDivider: {
    height: mediumScale(1),
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  cancelText: {
    textAlign: 'center',
    color: Colors.textLight,
    fontWeight: '600',
  },
});
