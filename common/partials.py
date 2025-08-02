from common.schemas import DocumentCategory

DOCUMENT_CATEGORY_PARTIAL = "Use one of the following categories to assess the document's tone: "
DOCUMENT_CATEGORY_PARTIAL += ", ".join([e.value for e in DocumentCategory])