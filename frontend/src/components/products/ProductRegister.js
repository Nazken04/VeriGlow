import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerProduct } from '../../redux/actions/productActions'; // Assuming this path is correct
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaMinus, FaInfoCircle, FaTimesCircle } from 'react-icons/fa'; // For stepper, info icons, and clear tag icon
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router for navigation

// IMPORTANT: Ensure this path is correct relative to your component
// This CSS file will contain all the new styling for the redesigned form.
import "../../styles/ProductRegister.css";

const ProductRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerLoading, registerError, registerSuccess } = useSelector(state => state.product);

  const [formData, setFormData] = useState({
    productName: '',
    manufacturingDate: '',
    expiryDate: '',
    ingredients: [],
    amount: 1,
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal
  const [ingredientInput, setIngredientInput] = useState(''); // State for current ingredient typing

  // Refs for tooltips/info icons
  const ingredientTooltipRef = useRef(null);
  const [showIngredientTooltip, setShowIngredientTooltip] = useState(false);

  // --- Utility Functions ---
  const today = new Date().toISOString().split('T')[0];

  const suggestExpiryDate = (productName, manufacturingDate) => {
    if (!manufacturingDate) return '';
    const manDate = new Date(manufacturingDate);
    let shelfLifeMonths = 12; // Default for 'Face Mask' (from example)
    const lowerCaseProductName = productName.toLowerCase();

    if (lowerCaseProductName.includes('eyesha') || lowerCaseProductName.includes('eyeshadow')) {
      shelfLifeMonths = 36; // Example rule: Eyeshadow lasts 36 months
    } else if (lowerCaseProductName.includes('mask') || lowerCaseProductName.includes('face mask')) {
      shelfLifeMonths = 12; // Example rule: Face mask lasts 12 months
    } else if (lowerCaseProductName.includes('lipstick')) { // Another example
      shelfLifeMonths = 24;
    }

    manDate.setMonth(manDate.getMonth() + shelfLifeMonths);
    // Ensure date is valid (e.g., if adding months goes past end of month, it adjusts)
    const day = String(manDate.getDate()).padStart(2, '0');
    const month = String(manDate.getMonth() + 1).padStart(2, '0');
    const year = manDate.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // --- Validation Logic (Improved) ---
  useEffect(() => {
    const newErrors = {};
    const { productName, manufacturingDate, expiryDate, ingredients, amount, imageUrl } = formData;

    // Required fields
    if (!productName.trim()) newErrors.productName = 'Product name is required.';
    if (!manufacturingDate) newErrors.manufacturingDate = 'Manufacturing date is required.';
    if (!expiryDate) newErrors.expiryDate = 'Expiry date is required.';
    if (ingredients.length === 0 || ingredients.some(ing => !ing.trim())) {
      newErrors.ingredients = 'At least one ingredient is required.';
    }
    if (amount < 1) newErrors.amount = 'Amount must be at least 1.';

    // Date logic
    if (manufacturingDate && expiryDate) {
      const manDateObj = new Date(manufacturingDate);
      const expDateObj = new Date(expiryDate);
      if (expDateObj <= manDateObj) {
        newErrors.expiryDate = 'Expiry date must be after manufacturing date.';
      }
      if (manDateObj > new Date(today)) {
          newErrors.manufacturingDate = 'Manufacturing date cannot be in the future.';
      }
    }

    // Image URL validation (now REQUIRED)
    if (!imageUrl.trim()) { // Check if imageUrl is empty
        newErrors.imageUrl = 'Product image URL is required.';
    } else if (!/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(imageUrl)) {
        newErrors.imageUrl = 'Please enter a valid URL.';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData, today]);

  // --- Auto-suggestion effects ---
  useEffect(() => {
    // Auto-suggest Expiry Date
    if (formData.productName && formData.manufacturingDate) {
      const suggestedExp = suggestExpiryDate(formData.productName, formData.manufacturingDate);
      if (suggestedExp && formData.expiryDate !== suggestedExp) {
        // Only auto-fill if the user hasn't explicitly set it or it's empty
        setFormData(prev => ({
          ...prev,
          expiryDate: suggestedExp
        }));
      }
    }
  }, [formData.productName, formData.manufacturingDate]);


  // --- Event Handlers ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleAmountChange = (newAmount) => {
    setFormData(prev => ({
      ...prev,
      amount: Math.max(1, newAmount) // Ensure amount is always at least 1
    }));
  };

  const handleIngredientInput = (e) => {
    setIngredientInput(e.target.value);
  };

  const addIngredient = (ingredient) => {
    const trimmedIngredient = ingredient.trim();
    if (trimmedIngredient && !formData.ingredients.includes(trimmedIngredient)) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, trimmedIngredient]
      }));
      setIngredientInput(''); // Clear input after adding
    }
  };

  const handleIngredientKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Prevent form submission on Enter
      addIngredient(ingredientInput);
    } else if (e.key === 'Backspace' && ingredientInput === '' && formData.ingredients.length > 0) {
      // Allow backspace to remove the last tag
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.slice(0, prev.ingredients.length - 1)
      }));
    }
  };

  const removeIngredient = (ingredientToRemove) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing !== ingredientToRemove)
    }));
  };

  const handleIngredientQuickAdd = (e) => {
    addIngredient(e.target.value);
    e.target.value = ''; // Reset select to default option
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    const productData = {
      product_name: formData.productName,
      manufacturing_date: formData.manufacturingDate,
      expiry_date: formData.expiryDate,
      ingredients: formData.ingredients.join(', '), // Convert array to string
      amount: formData.amount,
      image_url: formData.imageUrl
    };

    const result = await dispatch(registerProduct(productData));
    if (result.success) {
      clearForm(); // <--- ADDED: Clear form fields after successful registration
      setShowSuccessModal(true); // Show success modal
    } else {
      toast.error(result.error || 'Failed to register product. Please try again.');
    }
  };

  const clearForm = () => {
    setFormData({
      productName: '',
      manufacturingDate: '',
      expiryDate: '',
      ingredients: [],
      amount: 1,
      imageUrl: ''
    });
    setErrors({});
    setIngredientInput('');
    setShowSuccessModal(false); // Hide modal if open
  };

  const handleModalViewOverview = () => {
    setShowSuccessModal(false);
    navigate('/batch-overview'); // Navigate to batch overview page
  };

  const handleModalRegisterAnother = () => {
    clearForm(); // Clear form and stay on page (already clears form)
  };

  return (
    <div className="product-register-container">
      {/* Page Header consistent with Batch Overview */}
      <div className="page-header">
        <h1>Register New Product Batch</h1>
        <p className="subtitle">Securely register new manufacturing batches for traceability and authenticity. Please ensure all details are accurate.</p>
        <button className="secondary-button back-to-overview" onClick={() => navigate('/batch-overview')}>
          Back to Batch Overview
        </button>
      </div>

      {/* Main Form Area */}
      <div className="registration-form-card">
        <form onSubmit={handleSubmit} noValidate>

          {/* Section: Product Information */}
          <div className="form-section">
            <h3>Product Information</h3>
            <div className="form-group full-width-group">
              <label htmlFor="productName">Product Name <span className="required-star">*</span>:</label>
              <input
                type="text"
                id="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g., Luxe Eyeshadow Palette"
                className={errors.productName ? 'error-input' : ''}
              />
              {errors.productName && <span className="error-message">{errors.productName}</span>}
            </div>

            {/* Product Image URL with Preview (Now REQUIRED) */}
            <div className="form-group full-width-group image-upload-group">
              <label htmlFor="imageUrl">Product Image URL <span className="required-star">*</span>:</label>
              <div className="image-input-wrapper">
                <input
                  type="url"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  required // Added required attribute
                  placeholder="https://example.com/image.jpg"
                  className={errors.imageUrl ? 'error-input' : ''}
                />
                {formData.imageUrl && (
                  <div className="image-preview-container">
                    {errors.imageUrl ? (
                        <FaTimesCircle className="preview-error-icon" title={errors.imageUrl} />
                    ) : (
                        <img
                            src={formData.imageUrl}
                            alt="Product Preview"
                            className="image-preview"
                            onError={(e) => { e.target.onerror = null; e.target.src="/path/to/default-placeholder.png"; setErrors(prev => ({...prev, imageUrl: 'Invalid image URL'})); }}
                        />
                    )}
                  </div>
                )}
              </div>
              {errors.imageUrl && <span className="error-message">{errors.imageUrl}</span>}
            </div>
          </div>

          {/* Section: Batch Details */}
          <div className="form-section">
            <h3>Batch Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manufacturingDate">Manufacturing Date <span className="required-star">*</span>:</label>
                <input
                  type="date"
                  id="manufacturingDate"
                  value={formData.manufacturingDate}
                  onChange={handleChange}
                  max={today}
                  className={errors.manufacturingDate ? 'error-input' : ''}
                />
                {errors.manufacturingDate && <span className="error-message">{errors.manufacturingDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date <span className="required-star">*</span>:</label>
                <input
                  type="date"
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  min={formData.manufacturingDate || today}
                  className={errors.expiryDate ? 'error-input' : ''}
                />
                {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
              </div>
            </div>

            {/* Amount Stepper */}
            <div className="form-group amount-group">
              <label htmlFor="amount">Amount of Products <span className="required-star">*</span>:</label>
              <div className="amount-stepper">
                <button type="button" onClick={() => handleAmountChange(formData.amount - 1)} className="stepper-btn">
                  <FaMinus />
                </button>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(parseInt(e.target.value) || 0)}
                  min="1"
                  className={errors.amount ? 'error-input' : ''}
                />
                <button type="button" onClick={() => handleAmountChange(formData.amount + 1)} className="stepper-btn">
                  <FaPlus />
                </button>
              </div>
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>
          </div>

          {/* Section: Composition */}
          <div className="form-section">
            <h3>Composition</h3>
            <div className="form-group full-width-group">
              <label htmlFor="ingredients-input">
                Ingredients <span className="required-star">*</span>
                <span
                  className="info-icon"
                  onMouseEnter={() => setShowIngredientTooltip(true)}
                  onMouseLeave={() => setShowIngredientTooltip(false)}
                  ref={ingredientTooltipRef}
                >
                  <FaInfoCircle />
                  {showIngredientTooltip && (
                    <div className="tooltip" style={{
                      left: ingredientTooltipRef.current.offsetLeft + ingredientTooltipRef.current.offsetWidth / 2,
                      top: ingredientTooltipRef.current.offsetTop + ingredientTooltipRef.current.offsetHeight + 5
                    }}>
                      Separate ingredients by pressing Enter or comma.
                    </div>
                  )}
                </span>
                :
              </label>
              <div className={`tags-input-container ${errors.ingredients ? 'error-input' : ''}`}>
                {formData.ingredients.map((ingredient, index) => (
                  <span key={index} className="tag">
                    {ingredient}
                    <button type="button" onClick={() => removeIngredient(ingredient)} className="tag-remove-btn">
                      <FaTimesCircle />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  id="ingredients-input"
                  value={ingredientInput}
                  onChange={handleIngredientInput}
                  onKeyDown={handleIngredientKeyDown}
                  placeholder="e.g., Aqua, Glycerin, Hyaluronic Acid"
                />
              </div>
              {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}

              {/* Ingredient Quick-Add Dropdown */}
              <div className="ingredient-quick-add">
                <label htmlFor="quick-add-ingredient">Quick Add Common:</label>
                <select id="quick-add-ingredient" onChange={handleIngredientQuickAdd}>
                  <option value="">Select an ingredient</option>
                  <option value="Aqua">Aqua</option>
                  <option value="Glycerin">Glycerin</option>
                  <option value="Parfum">Parfum</option>
                  <option value="Tocopherol">Tocopherol</option>
                  <option value="Hyaluronic Acid">Hyaluronic Acid</option>
                  <option value="Niacinamide">Niacinamide</option>
                  {/* Add more common ingredients here */}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={clearForm}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={registerLoading || !isFormValid}
              className={`primary-button ${registerLoading ? 'loading' : ''}`}
            >
              {registerLoading ? (
                <>
                  <span className="spinner"></span> Registering...
                </>
              ) : (
                'Register New Batch'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Batch Registered Successfully!</h3>
            <p>Your product batch has been successfully added to the system.</p>
            <div className="modal-actions">
              <button className="primary-button" onClick={handleModalViewOverview}>
                View Batch Overview
              </button>
              <button className="secondary-button" onClick={handleModalRegisterAnother}>
                Register Another Batch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductRegister;