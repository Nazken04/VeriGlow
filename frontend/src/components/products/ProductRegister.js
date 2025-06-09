import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerProduct } from '../../redux/actions/productActions';
import { toast } from 'react-toastify'; // Ensure react-toastify is imported
import 'react-toastify/dist/ReactToastify.css'; // Don't forget to import its CSS
import { FaPlus, FaMinus, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// IMPORTANT: For react-toastify to work, you MUST include <ToastContainer />
// in your main App.js or a top-level component. Example in App.js:
// import { ToastContainer } from 'react-toastify';
// function App() {
//   return (
//     <>
//       <Router>
//         {/* Your routes */}
//       </Router>
//       <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
//     </>
//   );
// }

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ingredientInput, setIngredientInput] = useState('');

  const ingredientTooltipRef = useRef(null);
  const [showIngredientTooltip, setShowIngredientTooltip] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const suggestExpiryDate = (productName, manufacturingDate) => {
    if (!manufacturingDate) return '';
    const manDate = new Date(manufacturingDate);
    let shelfLifeMonths = 12;
    const lowerCaseProductName = productName.toLowerCase();

    if (lowerCaseProductName.includes('eyesha') || lowerCaseProductName.includes('eyeshadow')) {
      shelfLifeMonths = 36;
    } else if (lowerCaseProductName.includes('mask') || lowerCaseProductName.includes('face mask')) {
      shelfLifeMonths = 12;
    } else if (lowerCaseProductName.includes('lipstick')) {
      shelfLifeMonths = 24;
    }

    manDate.setMonth(manDate.getMonth() + shelfLifeMonths);
    const day = String(manDate.getDate()).padStart(2, '0');
    const month = String(manDate.getMonth() + 1).padStart(2, '0');
    const year = manDate.getFullYear();
    return `${year}-${month}-${day}`;
  };

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
    if (!imageUrl.trim()) {
        newErrors.imageUrl = 'Product image URL is required.';
    } else if (!/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(imageUrl)) {
        newErrors.imageUrl = 'Please enter a valid URL.';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData, today]);

  // Auto-suggestion effects
  useEffect(() => {
    // Auto-suggest Expiry Date
    if (formData.productName && formData.manufacturingDate) {
      const suggestedExp = suggestExpiryDate(formData.productName, formData.manufacturingDate);
      if (suggestedExp && formData.expiryDate !== suggestedExp) {
        setFormData(prev => ({
          ...prev,
          expiryDate: suggestedExp
        }));
      }
    }
  }, [formData.productName, formData.manufacturingDate]);


  // Event Handlers
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
      amount: Math.max(1, newAmount)
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
      // Only clear the text input state here if we are adding from the text input itself
      // If called from quick-add, it will be handled by setting ingredientInput to '' after check
      // For now, let's keep it controlled. Clearing input happens below explicitly if needed.
    }
  };

  const handleIngredientKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredient(ingredientInput);
      setIngredientInput(''); // Clear input after adding via Enter/Comma
    } else if (e.key === 'Backspace' && ingredientInput === '' && formData.ingredients.length > 0) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.slice(0, prev.ingredients.length - 1)
      }));
    }
  };

  // MODIFIED: To handle both typed input and quick-add
  const handleIngredientQuickAdd = (e) => {
    // First, add any ingredient currently being typed in the text input field
    if (ingredientInput.trim()) {
      addIngredient(ingredientInput);
      setIngredientInput(''); // Clear the text input after adding its content
    }

    // Then, add the selected quick-add ingredient
    const selectedIngredient = e.target.value;
    if (selectedIngredient && selectedIngredient !== "") { // Ensure a valid option was selected (not the default empty option)
      addIngredient(selectedIngredient);
    }
    e.target.value = ''; // Reset the select dropdown to its default "Select an ingredient" option
  };

  const removeIngredient = (ingredientToRemove) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing !== ingredientToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    // Add any remaining typed ingredient before submitting if user didn't press enter/comma
    if (ingredientInput.trim()) {
        addIngredient(ingredientInput);
        setIngredientInput(''); // Clear after adding
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
      toast.success(`${formData.amount} products registered successfully! You can view them in "Batch Overview".`);
      clearForm();
      setShowSuccessModal(true);
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
    setShowSuccessModal(false);
  };

  const handleModalViewOverview = () => {
    setShowSuccessModal(false);
    navigate('/product');
  };

  const handleModalRegisterAnother = () => {
    clearForm();
  };

  return (
    <div className="product-register-container">
      {/* Page Header consistent with Batch Overview */}
      <div className="page-header">
        <h1>Register New Product Batch</h1>
        <button className="secondary-button back-to-overview" onClick={() => navigate('/product')}>
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
                  required
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
                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/64x64?text=Image+Error"; setErrors(prev => ({...prev, imageUrl: 'Invalid image URL'})); }}
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
                  {/* Added message about blockchain delay */}
                  <span className="loading-info-text"> (This may take a moment as data is stored on the blockchain)</span>
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
            {/* Added explicit instruction for where to view */}
            <p>You can now view and manage these products in the "Batch Overview" section.</p>
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

