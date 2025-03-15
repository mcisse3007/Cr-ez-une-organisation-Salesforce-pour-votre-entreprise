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
    @track hasNegativeQuantity = false; // 
    @track isCommercial = false; 
    @track draftValues = []; 
    @track products = null; 
    @track hasProducts = false;
    subscription = {};
    channelName = '/event/OpportunityProductUpdate_e__e';



    get formattedLabel() {
        return `<strong style="color: black;">${this.label.PricebookAndAddProduct}</strong>`; 
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

    @wire(isAdmin)
    wiredIsAdmin({ error, data }) {
        if (data) {
            this.isCommercial = !data;
            this.setColumns();
        } else if (error) {
            console.error('Error checking user profile:', error);
        }
    }


    @wire(findProductsByOpp, { opportunityId: '$recordId' })
    wiredFindProductsByOpp (result) {
        this.OpportunityProducts = result;
        const { data, error } = result;
        console.debug('data', data);
        if (data) {
            this.products = data.map(item => {
                const stockDiff = item.Product2.QuantityInStock__c - item.Quantity;
                const quantityClass = stockDiff < 0 ? 'slds-box slds-theme_shade slds-theme_alert-texture' : ''; // Utilisation de la classe CSS pour mettre en évidence les produits en stock en rayures grises et blanches
                console.debug('diff:', stockDiff);
                let quantityStyle = ''; 
                if (stockDiff < 0) {
                    quantityStyle = 'color: red; font-weight: bold;';
                    this.hasNegativeQuantity = true;
                } else {
                    quantityStyle = 'color: green; font-weight: bold;';
                }
                return {
                    ...item,
                    opportunityLineItemId: item.Product2Id,
                    productName: item.Product2.Name,
                    quantityInStock: item.Product2.QuantityInStock__c,
                    quantityStyle,
                    quantityClass
                };
            });
            this.hasProducts = this.products.length > 0; 
            if(!this.hasProducts){
                this.hasNegativeQuantity = false;
            }
        } else if (error) {
            console.error('Erreur lors de la récupération des données :', error);
            this.error = error;
            this.products = []; 
            this.hasProducts = false;
            this.hasNegativeQuantity = false;
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name; 
        const row = event.detail.row;
        console.log('Action Name:', actionName);
        console.log('Row Data:', row);

        switch (actionName) {
            case 'view':
                console.log('Navigating to product:', row.opportunityLineItemId);
                this.navigateToProduct(row.opportunityLineItemId);
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




handleSuppr(opportunityLineItemId){
deleteOppLineItem ({oppItem: opportunityLineItemId})
.then(() => {
    console.log('succès de la suppr');
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: this.label.confirmDelete,
            variant: 'success'
        })
    );
     refreshApex(this.OpportunityProducts);
})
.catch((error) => {
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error deleting record',
            message: error.body.message,
            variant: 'error'
        })
    );
});
}



handleCellChange(event) {
    this.draftValues = event.detail.draftValues;
    console.log('Draft Values on cell change:', this.draftValues);  // Débogage
}

connectedCallback() {
    console.log('connected       Callback');

    this.registerErrorListener();
    this.handleSubscribe();
}

disconnectedCallback() {
    this.handleUnsubscribe();
}


handleSave(event) {
    console.log('Save button clicked');
    const updatedFields = event.detail.draftValues; // Récupération des valeurs modifiées ds le tableau
    console.log('Updated Fields to Save:', updatedFields);

    if (updatedFields.length === 0) { // Vérifie si aucune modification n'a été faite (si updatedFields est vide). sinon la fonction handlesave s'arrete. 
        console.warn('No changes to save.');
        return;
    }
    const productsToUpdate = this.products.filter(e => e.Id === updatedFields[0].Id);
    console.log('Products to update:', productsToUpdate);

    const fieldsWithId = productsToUpdate.map(field => ({ 
        ...field,
        OpportunityId: this.recordId,
        Quantity: updatedFields[0].quantityInStock
    })).filter(item => item.Id);

    console.log('Fields with IDs:', fieldsWithId);

    if (fieldsWithId.length === 0) {
        console.error('No valid Ids found for update.');
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'No valid Ids found for update.',
                variant: 'error'
            })
        );
        return;
    }
    // On envoie les champs avec l'ID à la méthode updateOpportunityProduct de OpportunityProductController.cls
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
            return refreshApex(this.OpportunityProducts);  // Rafraîchit les données après mise à jour
        })
        .catch(error => {
            console.error('Error updating record:', error);
            const errorMessage = error.body ? error.body.message : JSON.stringify(error);
            console.log('Complete Error Message:', errorMessage);
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

handleSubscribe() {
    const messageCallback = (response) => {
        console.log('Événement reçu:', JSON.stringify(response));
        if (response.data.payload.Opportunity_Id_c__c === this.recordId) {
            refreshApex(this.OpportunityProducts);
        }
    };

    subscribe(this.channelName, -1, messageCallback)
        .then(response => {
            console.log('Abonnement réussi');
            this.subscription = response;
        })
        .catch(error => {
            console.error('Erreur lors de l\'abonnement:', error);
        });
}

handleUnsubscribe() {
    unsubscribe(this.subscription)
        .then(() => {
            console.log('Désabonnement réussi');
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