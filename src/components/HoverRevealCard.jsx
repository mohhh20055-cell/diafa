import React from 'react'

/**
 * HoverRevealCard - بطاقة تكشف محتوى ديناميكي عند التمرير فوقها
 *
 * @param {Object} props
 * @param {string} props.image - صورة البطاقة
 * @param {string} props.badge - شارة البطاقة (مثل "مميز", "جديد")
 * @param {string} props.title - عنوان البطاقة
 * @param {string} props.location - الموقع
 * @param {number} props.rating - التقييم (من 5)
 * @param {number} props.reviewsCount - عدد التقييمات
 * @param {string[]} props.amenities - قائمة المرافق
 * @param {string} props.price - السعر
 * @param {string} props.priceUnit - وحدة السعر (مثل "/ليلة")
 * @param {string} props.bookButtonText - نص زر الحجز
 * @param {Function} props.onBook - دالة عند النقر على زر الحجز
 */
const HoverRevealCard = ({
  image,
  badge,
  title,
  location,
  rating,
  reviewsCount,
  amenities = [],
  price,
  priceUnit = '/ليلة',
  bookButtonText = 'احجز الآن',
  onBook,
}) => {
  const safeRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0
  const hasRating = reviewsCount > 0 || safeRating > 0
  // Generate star rating string
  const fullStars = Math.floor(safeRating)
  const hasHalfStar = safeRating % 1 >= 0.5
  const stars = '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))

  return (
    <div className="hover-reveal-card">
      {/* Image Section */}
      <div className="card-image">
        <img src={image} alt={title} loading="lazy" />
        <div className="image-overlay" />
        {badge && <span className="card-badge">{badge}</span>}
      </div>

      {/* Content Section */}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <div className="card-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {location}
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 my-1.5">
            {amenities.map((amenity, index) => (
              <span key={index} className="inline-block bg-amber-50 text-amber-900 border border-amber-200/80 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                {amenity}
              </span>
            ))}
          </div>
        )}
        {hasRating && (
        <div className="card-rating">
          <span className="stars">{stars}</span>
          <span className="rating-value">{safeRating.toFixed(1)}</span>
          <span className="reviews-count">({reviewsCount} تقييم)</span>
        </div>
        )}
      </div>

      {/* Hidden Reveal Content */}
      <div className="reveal-content">
        <div className="price-row">
          <button className="book-btn" onClick={onBook}>
            {bookButtonText}
          </button>
        </div>
      </div>

      {/* Footer with price preview */}
      <div className="card-footer">
        <div className="price-preview">
          {price} <span>{priceUnit}</span>
        </div>
      </div>
    </div>
  )
}

export default HoverRevealCard
