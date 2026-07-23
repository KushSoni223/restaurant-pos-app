from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.tax import RestaurantTaxSettings
from app.schemas.tax import TaxSettingsUpdate
from app.services.restaurant import RestaurantService

DEFAULT_TAX_RATE = Decimal("0.08")


class TaxService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_for_restaurant(self, restaurant_id: int) -> RestaurantTaxSettings:
        await RestaurantService(self.session).get_by_id_any(restaurant_id)
        result = await self.session.execute(
            select(RestaurantTaxSettings).where(
                RestaurantTaxSettings.restaurant_id == restaurant_id
            )
        )
        settings = result.scalar_one_or_none()
        if settings is None:
            settings = RestaurantTaxSettings(
                restaurant_id=restaurant_id,
                tax_enabled=True,
                tax_rate=DEFAULT_TAX_RATE,
                tax_label="Sales Tax",
                service_charge_enabled=False,
                service_charge_rate=Decimal("0.00"),
                service_charge_label="Service Charge",
                prices_include_tax=False,
            )
            self.session.add(settings)
            await self.session.commit()
            await self.session.refresh(settings)
        return settings

    async def get_tax_rate(self, restaurant_id: int) -> Decimal:
        settings = await self.get_for_restaurant(restaurant_id)
        if not settings.tax_enabled:
            return Decimal("0.00")
        return settings.tax_rate

    async def update_for_restaurant(
        self, restaurant_id: int, payload: TaxSettingsUpdate
    ) -> RestaurantTaxSettings:
        settings = await self.get_for_restaurant(restaurant_id)

        if payload.tax_enabled is not None:
            settings.tax_enabled = payload.tax_enabled
        if payload.tax_rate is not None:
            settings.tax_rate = Decimal(str(payload.tax_rate))
        if payload.tax_label is not None:
            settings.tax_label = payload.tax_label.strip()
        if payload.service_charge_enabled is not None:
            settings.service_charge_enabled = payload.service_charge_enabled
        if payload.service_charge_rate is not None:
            settings.service_charge_rate = Decimal(str(payload.service_charge_rate))
        if payload.service_charge_label is not None:
            settings.service_charge_label = payload.service_charge_label.strip()
        if payload.prices_include_tax is not None:
            settings.prices_include_tax = payload.prices_include_tax

        await self.session.commit()
        await self.session.refresh(settings)
        return settings
