# CORS and 500 Error Fix for Config Reuse

## Problem

When trying to reuse a configuration in production (`https://www.twyn.it`), the following errors occurred:

1. **CORS Error**: `Access to fetch at 'https://api.twyn.it/simulations/' from origin 'https://www.twyn.it' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

2. **500 Internal Server Error**: `POST https://api.twyn.it/simulations/ net::ERR_FAILED 500 (Internal Server Error)`

3. **Database Schema Error**: `Could not find the 'queue_priority' column of 'simulations' in the schema cache`

## Root Causes

### Issue 1: CORS Headers Missing on Error Responses

When an unhandled exception occurred in the FastAPI backend, the CORS middleware didn't add CORS headers to the error response. This is a known issue with FastAPI/Starlette - middleware doesn't process error responses from unhandled exceptions unless exception handlers are explicitly defined.

### Issue 2: Database Schema Mismatch

The backend code was trying to insert a `queue_priority` column into the `simulations` table, but this column doesn't exist in the production database schema. The `queue_priority` field is only used for in-memory queue management and doesn't need to be persisted.

## Solution

### 1. Added Global Exception Handlers (`main.py`)

Added three exception handlers to ensure CORS headers are always present:

```python
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with proper CORS headers"""
    logger.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"Access-Control-Allow-Origin": request.headers.get("origin", "*")}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with proper CORS headers"""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={"Access-Control-Allow-Origin": request.headers.get("origin", "*")}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with proper CORS headers"""
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": request.headers.get("origin", "*")}
    )
```

### 2. Enhanced Error Handling in `create_simulation` Endpoint

Added comprehensive try-except blocks:

- **JWT Verification**: Wrapped in try-except to catch token validation errors
- **Database Operations**: Added explicit error handling for simulation creation
- **Logging**: Added detailed logging at each step for better debugging
- **Catch-all Handler**: Added outer try-except to ensure no unhandled exceptions

### 3. Fixed Database Schema Mismatch (`database.py`)

Removed `queue_priority` from the database insert operation:

```python
# Before (causing error):
response = self.client.table('simulations').insert({
    'id': simulation_id,
    'user_id': user_id,
    'title': title,
    'prompt': prompt,
    'status': status,
    'scenario_id': scenario_id,
    'queue_priority': queue_priority,  # ❌ Column doesn't exist
    'created_at': datetime.utcnow().isoformat()
}).execute()

# After (fixed):
response = self.client.table('simulations').insert({
    'id': simulation_id,
    'user_id': user_id,
    'title': title,
    'prompt': prompt,
    'status': status,
    'scenario_id': scenario_id,
    'created_at': datetime.utcnow().isoformat()
}).execute()
```

The `queue_priority` parameter is still accepted by the function and logged, but it's only used for in-memory queue prioritization and not persisted to the database.

### 4. Improved Logging

Added logging statements to track:
- User authentication flow
- Plan limit checks
- Simulation creation steps
- All errors with full stack traces

## Files Changed

1. **`twyn-backend/src/api/main.py`**
   - Added imports for exception handling
   - Added three global exception handlers
   - All error responses now include CORS headers

2. **`twyn-backend/src/api/routes/simulations.py`**
   - Wrapped JWT verification in try-except
   - Added logging for each operation
   - Added explicit error handling for simulation creation
   - Added catch-all exception handler

3. **`twyn-backend/src/api/database.py`**
   - Removed `queue_priority` from database insert
   - Updated logging message to clarify it's in-memory only

## Testing

To verify the fix works:

1. **Test CORS on Error**:
   ```bash
   curl -X POST https://api.twyn.it/simulations/ \
     -H "Origin: https://www.twyn.it" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test"}' \
     -v
   ```
   
   Should see `Access-Control-Allow-Origin` header in response, even on error.

2. **Test Config Reuse**:
   - Log into https://www.twyn.it
   - Open a simulation's menu
   - Click "Use Configuration"
   - Should create a new simulation with the config copied

3. **Check Logs**:
   ```bash
   # On Railway or your hosting platform
   # Look for detailed error logs if issues persist
   ```

## Deployment

The fix has been deployed to production:

**Commits:**
1. `91828e5` - Fix CORS and 500 errors for config reuse
2. `cc28032` - Fix queue_priority column error

**Status:** ✅ Deployed to Railway

## Expected Behavior After Fix

1. **CORS Headers Present**: All responses (success or error) will include proper CORS headers
2. **Better Error Messages**: Frontend will receive detailed error messages instead of generic CORS errors
3. **Improved Debugging**: Backend logs will show exactly where errors occur
4. **No Database Schema Errors**: Config reuse will work without queue_priority column errors
5. **Successful Config Cloning**: Users can now successfully clone simulation configurations

## Verification Results

✅ **API Health**: `https://api.twyn.it/simulations/health` returns healthy  
✅ **CORS Headers**: Present on error responses (401, 500)  
✅ **Preflight Requests**: OPTIONS requests succeed with proper headers  
✅ **Database Schema**: queue_priority no longer causes insert errors

## Prevention

To prevent similar issues in the future:

1. **Always Use Exception Handlers**: Any FastAPI app with CORS should have exception handlers
2. **Comprehensive Error Handling**: Wrap all external operations (DB, API calls) in try-except
3. **Detailed Logging**: Log all errors with stack traces for production debugging
4. **Test Error Paths**: Test endpoints with invalid inputs to verify error handling
5. **Schema Validation**: Ensure backend code matches database schema before deploying
6. **Add Database Migrations**: When adding new columns, create and run migrations

## Additional Notes

- The exception handlers use the `origin` header from the request to set the CORS header, which is more secure than using `*`
- All errors are logged with full stack traces (`exc_info=True`) for debugging
- The fix doesn't change any business logic, only error handling and database operations
- The CORS configuration itself was correct; the issue was unhandled exceptions
- The `queue_priority` field is still used in memory for queue management but is not persisted to the database

## Status

✅ **FIXED** - Deployed to production and verified working

