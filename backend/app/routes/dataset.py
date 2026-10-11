from fastapi import APIRouter, HTTPException
from backend.app.services.dataset_importer import dataset_importer

router = APIRouter(prefix="/dataset", tags=["Dataset & Historical Events"])

@router.get("/summary")
def get_dataset_summary():
    """
    Get summary metrics of imported historical festival dataset (1,230 rows).
    Includes provenance warning: 'Dataset-provided — provenance unverified'.
    """
    try:
        return dataset_importer.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dataset summary: {str(e)}")

@router.post("/import")
def trigger_dataset_import():
    """
    Import/Re-import historical event attendance CSV into SQLite database.
    Deduplicates occurrences and bus stands without double counting.
    """
    try:
        return dataset_importer.import_dataset()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import dataset: {str(e)}")
