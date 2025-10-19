const searchVehicles = async (req, res) => {
  try {
    const {
      query,
      category,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      minSeating,
      maxSeating,
      location,
      pickupDate,
      dropoffDate,
      sortBy = 'daily_rate',
      order = 'ASC',
      page = 1,
      limit = 12
    } = req.query;

    let sqlQuery = `
      SELECT DISTINCT
        v.*,
        vc.name as category_name,
        l.name as location_name,
        l.city,
        COALESCE(AVG(rev.rating), 0) as avg_rating,
        COUNT(DISTINCT rev.id) as review_count
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      LEFT JOIN locations l ON l.id = v.current_location_id
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      WHERE v.status = 'available'
    `;

    const params = [];
    let paramIndex = 1;

    // Text search
    if (query) {
      sqlQuery += ` AND (
        v.make ILIKE ${paramIndex} OR 
        v.model ILIKE ${paramIndex} OR 
        vc.name ILIKE ${paramIndex}
      )`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      sqlQuery += ` AND v.category_id = ${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Transmission filter
    if (transmission) {
      sqlQuery += ` AND v.transmission_type = ${paramIndex}`;
      params.push(transmission);
      paramIndex++;
    }

    // Fuel type filter
    if (fuelType) {
      sqlQuery += ` AND v.fuel_type = ${paramIndex}`;
      params.push(fuelType);
      paramIndex++;
    }

    // Price range
    if (minPrice) {
      sqlQuery += ` AND v.daily_rate >= ${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      sqlQuery += ` AND v.daily_rate <= ${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    // Seating capacity
    if (minSeating) {
      sqlQuery += ` AND v.seating_capacity >= ${paramIndex}`;
      params.push(minSeating);
      paramIndex++;
    }

    if (maxSeating) {
      sqlQuery += ` AND v.seating_capacity <= ${paramIndex}`;
      params.push(maxSeating);
      paramIndex++;
    }

    // Location filter
    if (location) {
      sqlQuery += ` AND v.current_location_id = ${paramIndex}`;
      params.push(location);
      paramIndex++;
    }

    // Availability check for date range
    if (pickupDate && dropoffDate) {
      sqlQuery += ` AND v.id NOT IN (
        SELECT vehicle_id FROM reservations
        WHERE status IN ('confirmed', 'active')
          AND (
            (pickup_date <= ${paramIndex} AND dropoff_date >= ${paramIndex})
            OR (pickup_date <= ${paramIndex + 1} AND dropoff_date >= ${paramIndex + 1})
            OR (pickup_date >= ${paramIndex} AND dropoff_date <= ${paramIndex + 1})
          )
      )`;
      params.push(pickupDate, dropoffDate);
      paramIndex += 2;
    }

    sqlQuery += ` GROUP BY v.id, vc.name, l.name, l.city`;

    // Sorting
    const validSortFields = ['daily_rate', 'created_at', 'avg_rating', 'seating_capacity'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'daily_rate';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    sqlQuery += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const offset = (page - 1) * limit;
    sqlQuery += ` LIMIT ${paramIndex} OFFSET ${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(sqlQuery, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT v.id) 
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      WHERE v.status = 'available'
    `;
    // Add same filters for count (without joins that affect count)
    const countResult = await db.query(countQuery);

    res.json({
      vehicles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
};

// @desc    Get search filters/facets
// @route   GET /api/search/filters
// @access  Public
const getSearchFilters = async (req, res) => {
  try {
    // Get available categories
    const categoriesQuery = `
      SELECT 
        vc.id,
        vc.name,
        vc.description,
        COUNT(v.id) as vehicle_count,
        MIN(v.daily_rate) as min_price,
        MAX(v.daily_rate) as max_price
      FROM vehicle_categories vc
      LEFT JOIN vehicles v ON v.category_id = vc.id AND v.status = 'available'
      GROUP BY vc.id
      HAVING COUNT(v.id) > 0
      ORDER BY vc.name
    `;

    const categories = await db.query(categoriesQuery);

    // Get locations
    const locationsQuery = `
      SELECT 
        l.id,
        l.name,
        l.city,
        l.province,
        COUNT(v.id) as vehicle_count
      FROM locations l
      LEFT JOIN vehicles v ON v.current_location_id = l.id AND v.status = 'available'
      WHERE l.is_active = true
      GROUP BY l.id
      HAVING COUNT(v.id) > 0
      ORDER BY l.name
    `;

    const locations = await db.query(locationsQuery);

    // Get price range
    const priceRangeQuery = `
      SELECT 
        MIN(daily_rate) as min_price,
        MAX(daily_rate) as max_price,
        ROUND(AVG(daily_rate), 2) as avg_price
      FROM vehicles
      WHERE status = 'available'
    `;

    const priceRange = await db.query(priceRangeQuery);

    // Get transmission types
    const transmissionQuery = `
      SELECT 
        transmission_type,
        COUNT(*) as count
      FROM vehicles
      WHERE status = 'available'
      GROUP BY transmission_type
      ORDER BY count DESC
    `;

    const transmission = await db.query(transmissionQuery);

    // Get fuel types
    const fuelQuery = `
      SELECT 
        fuel_type,
        COUNT(*) as count
      FROM vehicles
      WHERE status = 'available'
      GROUP BY fuel_type
      ORDER BY count DESC
    `;

    const fuelTypes = await db.query(fuelQuery);

    // Get seating capacity range
    const seatingQuery = `
      SELECT 
        MIN(seating_capacity) as min_seating,
        MAX(seating_capacity) as max_seating
      FROM vehicles
      WHERE status = 'available'
    `;

    const seating = await db.query(seatingQuery);

    res.json({
      categories: categories.rows,
      locations: locations.rows,
      priceRange: priceRange.rows[0],
      transmission: transmission.rows,
      fuelTypes: fuelTypes.rows,
      seating: seating.rows[0]
    });
  } catch (error) {
    console.error('Error fetching search filters:', error);
    res.status(500).json({ error: 'Failed to fetch search filters' });
  }
};

module.exports = {
  searchVehicles,
  getSearchFilters
};
