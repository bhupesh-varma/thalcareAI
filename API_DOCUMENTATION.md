# Emergency Hospital Finder - API Documentation

## Base URL

```
http://localhost:8000
```

## Endpoints

### 1. POST /recommend

Find the best hospitals for emergency situations based on user input.

**URL**: `/recommend`

**Method**: `POST`

**Authentication**: None

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "city": "Delhi",
  "blood_type": "blood_o_pos",
  "query": "urgent accident with heavy bleeding, need O+ blood and trauma center",
  "user_lat": 28.6139,
  "user_lon": 77.2090
}
```

**Parameters:**
- `city` (string, required): Name of the city for hospital search
- `blood_type` (string, required): Patient's blood type in format `blood_{type}_{sign}`
  - Valid values: `blood_o_pos`, `blood_o_neg`, `blood_a_pos`, `blood_a_neg`, `blood_b_pos`, `blood_b_neg`, `blood_ab_pos`, `blood_ab_neg`
- `query` (string, required): Natural language description of the emergency
- `user_lat` (number, required): User's latitude (decimal degrees)
- `user_lon` (number, required): User's longitude (decimal degrees)

**Response (200 OK):**
```json
{
  "recommendations": [
    {
      "name": "Apollo Hospital Delhi",
      "rating": 4.2,
      "response": 19,
      "icu": 8,
      "blood": 6,
      "distance": 2.1,
      "explanation": "This hospital is highly recommended because it has excellent trauma center facilities with multiple ICU beds and adequate blood stocks. Distance is only 2.1 km making it very accessible in emergency situations."
    },
    {
      "name": "Max Hospital Saket",
      "rating": 4.5,
      "response": 15,
      "icu": 12,
      "blood": 8,
      "distance": 3.5,
      "explanation": "Excellent choice with faster response time and more ICU beds than the previous option. Higher rating indicates consistent quality care."
    }
  ]
}
```

**Response Fields:**
- `recommendations` (array): List of recommended hospitals
  - `name` (string): Hospital name
  - `rating` (number): Hospital rating (0-5)
  - `response` (number): Average response time in minutes
  - `icu` (number): Number of available ICU beds
  - `blood` (number): Number of blood units available (of requested type)
  - `distance` (number): Distance from user location in kilometers
  - `explanation` (string): AI-generated explanation for recommendation

**Response Status Codes:**
- `200`: Success
- `422`: Validation error (missing or invalid parameters)
- `500`: Internal server error

**Example cURL Request:**
```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Delhi",
    "blood_type": "blood_o_pos",
    "query": "Urgent accident with trauma and heavy bleeding",
    "user_lat": 28.6139,
    "user_lon": 77.2090
  }'
```

**Algorithm Explanation:**
The recommendation engine uses a hybrid search approach:
1. **Vector Search (50% weight)**: Uses OLLAMA embeddings to find hospitals matching the emergency description semantically
2. **Distance-based Search (30% weight)**: Prioritizes geographically closer hospitals
3. **Response Time (10% weight)**: Considers average response time of hospitals
4. **Rating (10% weight)**: Factors in hospital rating

Results are limited to top 5 hospitals.

---

### 2. POST /feedback

Submit user feedback about hospital recommendations to improve future suggestions.

**URL**: `/feedback`

**Method**: `POST`

**Authentication**: None

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "hospital": "Apollo Hospital Delhi",
  "rating": true,
  "comment": "Great service, doctor was very responsive and helpful",
  "user_lat": 28.6139,
  "user_lon": 77.2090
}
```

**Parameters:**
- `hospital` (string, required): Name of the hospital being reviewed
- `rating` (boolean, required): Whether the recommendation was helpful (true/false)
- `comment` (string, optional): User's feedback comment (max 500 characters recommended)
- `user_lat` (number, required): User's latitude where feedback was submitted
- `user_lon` (number, required): User's longitude where feedback was submitted

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Feedback recorded successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Error message describing what went wrong"
}
```

**Response Status Codes:**
- `200`: Success
- `422`: Validation error (missing or invalid parameters)
- `500`: Internal server error

**Database Table:**
Feedback is stored in PostgreSQL:
```sql
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  hospital TEXT NOT NULL,
  rating BOOLEAN NOT NULL,
  comment TEXT,
  lat FLOAT,
  lon FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Example cURL Request:**
```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "hospital": "Apollo Hospital Delhi",
    "rating": true,
    "comment": "Excellent service and professional staff",
    "user_lat": 28.6139,
    "user_lon": 77.2090
  }'
```

---

## Error Handling

### Common Error Responses

**422 Unprocessable Entity:**
```json
{
  "detail": [
    {
      "loc": ["body", "city"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```

---

## Blood Type Reference

| Code | Type | Percentage |
|------|------|-----------|
| `blood_o_pos` | O+ | ~37% |
| `blood_a_pos` | A+ | ~35% |
| `blood_b_pos` | B+ | ~13% |
| `blood_ab_pos` | AB+ | ~4% |
| `blood_o_neg` | O- | ~6% |
| `blood_a_neg` | A- | ~3% |
| `blood_b_neg` | B- | ~1% |
| `blood_ab_neg` | AB- | ~1% |

---

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Recommend 100 requests per minute per IP
- 10 parallel requests maximum

---

## CORS Configuration

The API allows requests from all origins. For production, restrict to:
```
Access-Control-Allow-Origins:
  - https://yourdomain.com
  - https://app.yourdomain.com
```

---

## Authentication

Currently no authentication required. For production, add:
- API key authentication
- JWT bearer tokens
- OAuth2 flow

---

## Best Practices

### For /recommend Endpoint

1. **Always include geolocation** - Impacts ranking significantly
2. **Be specific in query** - Better NLP matching
3. **Use correct blood type** - Critical for recommendations
4. **Limit requests** - Cache results when possible

### For /feedback Endpoint

1. **Collect feedback immediately** - While experience is fresh
2. **Be honest in ratings** - Improves system accuracy
3. **Add detailed comments** - Helps identify patterns
4. **Include location** - Helps with geographic analysis

---

## Response Time SLA

- `/recommend`: < 3 seconds (depends on OLLAMA)
- `/feedback`: < 500ms

---

## Testing

### Postman Collection

```json
{
  "info": {
    "name": "Emergency Hospital Finder API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Find Hospitals",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"city\": \"Delhi\",\n  \"blood_type\": \"blood_o_pos\",\n  \"query\": \"urgent accident\",\n  \"user_lat\": 28.6139,\n  \"user_lon\": 77.2090\n}"
        },
        "url": {"raw": "http://localhost:8000/recommend", "protocol": "http", "host": ["localhost"], "port": ["8000"], "path": ["recommend"]}
      }
    }
  ]
}
```

---

## Support & Troubleshooting

### API Returns No Results

1. Verify city name is spelled correctly
2. Check database has hospitals for that city
3. Ensure blood type is valid format
4. Check geolocation is correct

### Slow Response Time

1. Check OLLAMA service is running
2. Monitor database query performance
3. Check network latency
4. Consider caching for same queries

### Database Errors

1. Verify PostGreSQL is running
2. Check connection string in .env
3. Ensure feedback table exists
4. Check user has write permissions

### CORS Issues

1. Verify CORS middleware is enabled
2. Check frontend URL in allow_origins
3. Inspect browser console for details
4. Test with CORS browser extension

---

## Version History

### v1.0.0 (Current)
- Initial release
- POST /recommend - Hospital search
- POST /feedback - Feedback collection
- CORS enabled
- PostgreSQL feedback storage

### Planned for v2.0
- GET /health - Health check endpoint
- GET /hospitals/{id} - Hospital details
- GET /feedback/analytics - Feedback analysis
- PUT /feedback/{id} - Edit feedback
- DELETE /feedback/{id} - Delete feedback
- Authentication/Authorization
- Rate limiting
- Request/response logging

---

## Contact & Support

For API support or issues:
1. Check this documentation
2. Check error messages and logs
3. Contact development team
4. Review GitHub issues

## License

MIT License - Free to use and modify
