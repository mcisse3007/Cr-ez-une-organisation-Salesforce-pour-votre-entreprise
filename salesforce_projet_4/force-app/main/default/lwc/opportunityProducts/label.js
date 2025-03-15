import NO_PRODUCTS_MESSAGE from '@salesforce/label/c.No_Products_Message';
import STOCK_WARNING_MESSAGE from '@salesforce/label/c.Stock_Warning_Message';
import PRODUCT_NAME_COLUMN from '@salesforce/label/c.Product_Name_Column';
import UNIT_PRICE_COLUMN from '@salesforce/label/c.Unit_Price_Column';
import TOTAL_PRICE_COLUMN from '@salesforce/label/c.Total_Price_Column';
import QUANTITY_COLUMN from '@salesforce/label/c.Quantity_Column';
import STOCK_QUANTITY_COLUMN from '@salesforce/label/c.Stock_Quantity_Column';
import DELETE_ACTION from '@salesforce/label/c.Delete_Action';
import VIEW_PRODUCT_ACTION from '@salesforce/label/c.View_Product_Action';
import OPPORTUNITY_PRODUCTS_LABEL from '@salesforce/label/c.OPPORTUNITY_PRODUCTS_LABEL';
import CONFIRM_DELETE from '@salesforce/label/c.CONFIRM_DELETE';

const LABELS = {
    lineQuantityProblem: STOCK_WARNING_MESSAGE,
    PricebookAndAddProduct: NO_PRODUCTS_MESSAGE,
    quantityInStockLabel: STOCK_QUANTITY_COLUMN,
    QuantityLabel: QUANTITY_COLUMN,
    UnitPriceLabel: UNIT_PRICE_COLUMN,
    TotalPriceLabel: TOTAL_PRICE_COLUMN,
    SeeProductLabel: VIEW_PRODUCT_ACTION,
    ProductNameLabel: PRODUCT_NAME_COLUMN,
    DeleteLabel: DELETE_ACTION,
    opportunityProductsLabel: OPPORTUNITY_PRODUCTS_LABEL,
    ViewProductButton: VIEW_PRODUCT_ACTION,
    confirmDelete: CONFIRM_DELETE
};

export {LABELS};