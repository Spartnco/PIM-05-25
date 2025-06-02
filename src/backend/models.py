from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator # To create Pydantic models from Tortoise models

class Product(models.Model):
    """
    Represents a product.
    """
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255, index=True)
    ref = fields.CharField(max_length=100, null=True, index=True)
    description = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    documents: fields.ReverseRelation["Document"] # Reverse relation for documents

    def __str__(self):
        return self.name

class Document(models.Model):
    """
    Represents a document associated with a product.
    """
    id = fields.IntField(pk=True)
    product: fields.ForeignKeyRelation[Product] = fields.ForeignKeyField(
        "models.Product", related_name="documents", on_delete=fields.CASCADE
    )
    type = fields.CharField(max_length=20)  # "excel", "image", "pdf"
    path_or_url = fields.CharField(max_length=1024) # Stores file path in 'media/' or an external URL
    label = fields.CharField(max_length=255, null=True) # User-friendly label for the document
    uploaded_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type}: {self.label or self.path_or_url} for {self.product_id}"

# Pydantic models for request/response validation (optional but good practice)
# These can be moved to a separate schemas.py or pydantic_models.py file later
Product_Pydantic = pydantic_model_creator(Product, name="Product")
ProductIn_Pydantic = pydantic_model_creator(Product, name="ProductIn", exclude_readonly=True)

Document_Pydantic = pydantic_model_creator(Document, name="Document")
DocumentIn_Pydantic = pydantic_model_creator(Document, name="DocumentIn", exclude_readonly=True, exclude=("product_id",)) # product_id will be path param
