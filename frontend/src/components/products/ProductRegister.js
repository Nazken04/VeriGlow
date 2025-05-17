import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerProduct } from '../../redux/actions/productActions';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../../styles/ProductRegister.css"; // Path to the updated CSS

const ProductRegister = () => {
  const dispatch = useDispatch();
  const { registerLoading, registerError, registerSuccess } = useSelector(state => state.product);

  const [formData, setFormData] = useState({
    productName: '',
    manufacturingDate: '',
    expiryDate: '',
    ingredients: '',
    amount: 1,
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const validateForm = () => {
      const newErrors = {};
      if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
      if (!formData.manufacturingDate) newErrors.manufacturingDate = 'Manufacturing date is required';
      if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
      if (!formData.ingredients.trim()) newErrors.ingredients = 'Ingredients are required';
      if (formData.amount < 1) newErrors.amount = 'Amount must be at least 1';
      if (formData.manufacturingDate && formData.expiryDate) {
        const manufacturingDateObj = new Date(formData.manufacturingDate);
        const expiryDateObj = new Date(formData.expiryDate);
        if (expiryDateObj <= manufacturingDateObj) {
          newErrors.expiryDate = 'Expiry date must be after manufacturing date';
        }
      }
      setErrors(newErrors);
      setIsFormValid(Object.keys(newErrors).length === 0);
    };
    validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'amount' ? Math.max(1, parseInt(value) || 1) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please fix the errors in the form');
      return;
    }
    const productData = {
      product_name: formData.productName,
      manufacturing_date: formData.manufacturingDate,
      expiry_date: formData.expiryDate,
      ingredients: formData.ingredients,
      amount: formData.amount,
      image_url: formData.imageUrl
    };
    const result = await dispatch(registerProduct(productData));
    if (result.success) {
      toast.success(`${formData.amount} product(s) registered successfully!`);
      clearForm();
    } else {
      toast.error(result.error || 'Failed to register product');
    }
  };

  const clearForm = () => {
    setFormData({
      productName: '',
      manufacturingDate: '',
      expiryDate: '',
      ingredients: '',
      amount: 1,
      imageUrl: ''
    });
    // Optionally clear errors as well, or they will clear on next validation
    setErrors({});
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="product-register-container">
      <div className="info-block">
        <p>
          <strong>Why Register Your Product?</strong><br />
          Registering your product allows you to securely track manufacturing and expiry details,
          ensuring authenticity and building trust with your customers.
        </p>
        <p>
          Please fill all required fields carefully. Dates must be valid, and ingredients should be separated by commas.
        </p>
      </div>

      {registerSuccess && !registerLoading && ( // Ensure success message doesn't show during a new loading state
        <div className="success-message">
          <h3>Registration Successful!</h3>
          <p>Your products have been successfully registered.</p>
        </div>
      )}

      <h2>Register Product</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Product Name - Spans 2 columns */}
        <div className="form-group full-width-group">
          <label htmlFor="productName">Product Name:</label>
          <input
            type="text"
            id="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            className={errors.productName ? 'error-input' : ''}
          />
          {errors.productName && <span className="error-message">{errors.productName}</span>}
        </div>

        {/* Manufacturing Date & Expiry Date - On the same line using form-row */}
        <div className="form-row full-width-group"> {/* This div now wraps the two date fields */}
          <div className="form-group"> {/* Removed small-input class here as form-row handles sizing */}
            <label htmlFor="manufacturingDate">Manufacturing Date:</label>
            <input
              type="date"
              id="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleChange}
              required
              max={today}
              className={errors.manufacturingDate ? 'error-input' : ''}
            />
            {errors.manufacturingDate && <span className="error-message">{errors.manufacturingDate}</span>}
          </div>

          <div className="form-group"> {/* Removed small-input class here */}
            <label htmlFor="expiryDate">Expiry Date:</label>
            <input
              type="date"
              id="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              min={formData.manufacturingDate || today} // Ensure min date is set even if manufacturingDate is empty
              className={errors.expiryDate ? 'error-input' : ''}
            />
            {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
          </div>
        </div>

        {/* Ingredients - Spans 2 columns */}
        <div className="form-group full-width-group">
          <label htmlFor="ingredients">Ingredients (comma separated):</label>
          <textarea
            id="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            required
            className={errors.ingredients ? 'error-input' : ''}
            placeholder="e.g., Aqua, Glycerin, Parfum"
          ></textarea>
          {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}
        </div>

        {/* Amount & Image URL - On the same line (rely on grid behavior) */}
        <div className="form-group small-input"> {/* Keep small-input for these if they are direct grid children */}
          <label htmlFor="amount">Amount of Products:</label>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="1"
            className={errors.amount ? 'error-input' : ''}
          />
          {errors.amount && <span className="error-message">{errors.amount}</span>}
        </div>

        <div className="form-group small-input"> {/* Keep small-input */}
          <label htmlFor="imageUrl">Product Image URL (Optional):</label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            pattern="https?://.+"
            title="Please enter a valid URL"
          />
        </div>

        {/* Submit Button - Spans 2 columns */}
        <button
          type="submit"
          disabled={registerLoading || !isFormValid}
          className={`submit-btn full-width-group ${registerLoading ? 'loading' : ''}`}
        >
          {registerLoading ? (
            <>
              <span className="spinner"></span> Registering...
            </>
          ) : (
            'Register Product'
          )}
        </button>
      </form>
    </div>
  );
};

export default ProductRegister;