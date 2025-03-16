import { LightningElement, wire, track, api } from 'lwc';
import findProductsByOpp  from '@salesforce/apex/OpportunityProductsController.findProductsByOpp';
import deleteOppLineItem  from '@salesforce/apex/OpportunityProductsController.deleteItem';
import { refreshApex } from '@salesforce/apex';
import isAdmin from '@salesforce/apex/OpportunityProductsController.isAdmin';
import updateOpportunityProduct from '@salesforce/apex/OpportunityProductsController.updateOpportunityProduct';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';


import { LABELS } from './label';

const labels = LABELS;


export default class OpportunityProducts extends NavigationMixin(LightningElement)  {
    label = labels;
    @api recordId;
    OpportunityProducts;
    @track isCommercial = false; 
    @track draftValues = []; 
    @track products = [];
    subscription = {};
    channelName = '/event/OpportunityProductUpdate_e__e';

    get formattedLabel() {
        return `<strong style="color: black;">${this.label.PricebookAndAddProduct}</strong>`; 
    }

    @api
    get hasProducts() {
        return this.products.length > 0;
    }

    @api
    get hasNegativeQuantity() {
        return this.products.some(item => this.isQuantityError(item));
    }

    @track columns = [ 
        { label: this.label.ProductNameLabel, fieldName: 'productName', type: 'text' },
        { label: this.label.UnitPriceLabel, fieldName: 'UnitPrice', type: 'currency' },
        { label: this.label.TotalPriceLabel, fieldName: 'TotalPrice', type: 'currency' },
        { 
            label: this.label.QuantityLabel, 
            fieldName: 'Quantity', 
            type: 'number',
            cellAttributes: {
                style: { fieldName: 'quantityStyle' },
                class: { fieldName: 'quantityClass' },
                alignment: 'right'
            }
        },
        { label: this.label.quantityInStockLabel, fieldName: 'quantityInStock', type: 'number', editable: true },
        {
            label: this.label.SeeProductLabel,
            type: 'button',
            typeAttributes: {
                label: this.label.ViewProductButton,
                name: 'view',
                iconName: 'utility:preview',
                iconPosition: 'left',
                variant: 'brand'
            }
        },
        {
            label: this.label.DeleteLabel,
            type: 'button-icon',
            typeAttributes: {
                iconName: 'utility:delete',
                name: 'delete',
                variant: 'bare',
                alternativeText: 'Delete',
                title: 'Delete'
            }
        }
    ];

    async checkUserProfile() {
        try {
            const admin   = await isAdmin();
            this.isCommercial = !admin;
            this.setColumns();
        } catch (error) {
            console.error('Error checking profile:', error);
        }
    }

    @wire(findProductsByOpp, { opportunityId: '$recordId' })
    wiredFindProductsByOpp (result) {
        this.OpportunityProducts = result;
        const { data, error } = result;
        console.debug('data', data);
        if (data) {
            this.products = data.map(item => {
                const quantityClass = this.isQuantityError(item) ? 'slds-box slds-theme_shade slds-theme_alert-texture' : '';
                const quantityStyle = this.isQuantityError(item) ? 'color: red; font-weight: bold;' : 'color: green; font-weight: bold;';
                return {
                    ...item,
                    productName: item.Product2.Name,
                    quantityInStock: item.Product2.QuantityInStock__c,
                    quantityStyle,
                    quantityClass
                };
            });
        } else if (error) {
            console.error('Erreur lors de la récupération des données :', error);
            this.error = error;
            this.products = []; 
        }
    }

    isQuantityError(item) {
        return item.Quantity > item.Product2.QuantityInStock__c;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name; 
        const row = event.detail.row;
        switch (actionName) {
            case 'view':
                this.navigateToProduct(row.Product2Id);
                break;
            case 'delete':
                this.handleSuppr(row.Id);
                break;
            default:
                break;
        }
    }

    navigateToProduct(productId) { 
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: productId,
                actionName: 'view'
            },
        });
    }

// delete line item
handleSuppr(opportunityLineItemId){
    deleteOppLineItem({oppItem: opportunityLineItemId}).then(
        () => {
                console.debug('succès de la suppr');
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: this.label.confirmDelete,
                        variant: 'success'
                    })
                );
                return refreshApex(this.OpportunityProducts);
        }
    ).catch(
        (error) => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error deleting record',
                                message: error.body.message,
                                variant: 'error'
                                })
                            );
                    }
        );
}



handleCellChange(event) {
    this.draftValues = event.detail.draftValues;
}

connectedCallback() {
    this.checkUserProfile()
    this.registerErrorListener();
    this.handleSubscribe();
}

disconnectedCallback() {
    this.handleUnsubscribe();
}


handleSave(event) {
    const updatedFields = event.detail.draftValues; 
    if (updatedFields.length === 0) { 
        console.warn('No changes to save.');
        return;
    }
    const productsToUpdate = this.products.filter(e => e.Id === updatedFields[0].Id);

    const fieldsWithId = productsToUpdate.map(field => ({ 
        ...field,
        OpportunityId: this.recordId,
        Quantity: updatedFields[0].quantityInStock
    })).filter(item => item.Id);

    if (fieldsWithId.length === 0) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'No valid Ids found for update.',
                variant: 'error'
            })
        );
        return;
    }
    // update quantity in stock
    updateOpportunityProduct({ opportunityLineItem: fieldsWithId[0]})
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Quantity In Stock updated successfully.',
                    variant: 'success'
                })
            );
            this.draftValues = [];
            // refresh data
            return refreshApex(this.OpportunityProducts);  
        })
        .catch(error => {
            const errorMessage = error.body ? error.body.message : JSON.stringify(error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating record',
                    message: errorMessage,
                    variant: 'error'
                })
            );
        });
}
// Méthode pour définir les colonnes en fonction de l'utilisateur
setColumns() {
    if (this.isCommercial) {
        this.columns = this.columns.filter(column => column.label !== this.label.SeeProductLabel);
    }
}

// subscribe to event to update values when opp change or oppLineItem change 
handleSubscribe() {
    // subscribe callback for refreshing after current opp change
    const messageCallback = (response) => {
        if (response.data.payload.Opportunity_Id_c__c === this.recordId) {
            refreshApex(this.OpportunityProducts);
        }
    };
    subscribe(this.channelName, -1, messageCallback)
        .then(response => {
            // save subscription
            this.subscription = response;
        })
        .catch(error => {
            console.error('Erreur lors de l\'abonnement:', error);
        });
}

handleUnsubscribe() {
    unsubscribe(this.subscription)
        .then(() => {
            console.debug('Désabonnement réussi');
        })
        .catch(error => {
            console.error('Erreur lors du désabonnement:', error);
        });
}

registerErrorListener() {
    onError(error => {
        console.error('Erreur EMP API:', error);
    });
}

    
}