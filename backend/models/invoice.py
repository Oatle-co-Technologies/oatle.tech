from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import relationship

from backend.database.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    invoice_number = Column(
        String,
        unique=True,
        nullable=True,
        index=True,
    )

    client_id = Column(
        Integer,
        ForeignKey("clients.id"),
        nullable=False,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True,
    )

    discount_percent = Column(
        Float,
        nullable=False,
        default=0,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    # Kept temporarily for existing databases. New payments are written to
    # invoice_payments, while this value supplies the opening balance until
    # the backfill migration has been applied.
    legacy_amount_paid = Column(
        "amount_paid",
        Float,
        nullable=False,
        default=0,
    )

    status = Column(
        String,
        nullable=False,
        default="draft",
    )

    issue_date = Column(
        Date,
        nullable=False,
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    paid_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    client = relationship("Client")

    project = relationship("Project")

    payments = relationship(
        "InvoicePayment",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoicePayment.paid_at",
    )

    @property
    def total_paid(self) -> float:
        if self.payments:
            return sum(float(payment.amount) for payment in self.payments)
        return float(self.legacy_amount_paid or 0)

    @property
    def balance_due(self) -> float:
        return max(
            float(self.amount) - self.total_paid,
            0,
        )


class InvoicePayment(Base):
    __tablename__ = "invoice_payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(
        Integer,
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Float, nullable=False)
    paid_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")
