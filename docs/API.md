# API Documentation

## Endpoints

### 1. GET /api/v1/resource
- **Description:** Retrieves resource data.
- **Response:** Returns a JSON array of resources.

### 2. POST /api/v1/resource
- **Description:** Creates a new resource.
- **Request Body:** JSON object containing resource details.
- **Response:** Returns the created resource.

### 3. PUT /api/v1/resource/{id}
- **Description:** Updates an existing resource.
- **Request Body:** JSON object containing updated resource details.
- **Response:** Returns the updated resource.

### 4. DELETE /api/v1/resource/{id}
- **Description:** Deletes a resource.
- **Response:** Returns a confirmation message.

### Notes:
- Ensure to authenticate before accessing these endpoints.
- Responses are in JSON format.

## Error Codes
- **404:** Resource not found.
- **400:** Bad request.
- **500:** Internal server error.

## Example Request
```bash
curl -X GET https://api.example.com/api/v1/resource
```
## Example Response
```json
[
    {
        "id": 1,
        "name": "Example Resource"
    }
]
```
