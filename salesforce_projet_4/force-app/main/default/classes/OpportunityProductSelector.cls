public with sharing class OpportunityProductSelector {

public static List<OpportunityLineItem> findProductsByOpp(Id opportunityId){
	if (!Schema.sObjectType.OpportunityLineItem.fields.OpportunityId.isAccessible()) {
		throw new AuraHandledException('vous ne pouvez pas faire cette action');
	}
	return [Select Id, Product2Id, Product2.Name, UnitPrice, TotalPrice, Quantity, Product2.QuantityInStock__c From OpportunityLineItem WHERE OpportunityId = : opportunityId ];
}

public static void deleteItem (Id opportunityLineItemId) {
	OpportunityLineItem itemToDelete = [SELECT Id FROM OpportunityLineItem WHERE Id = : opportunityLineItemId];
	if (!Schema.sObjectType.OpportunityLineItem.isDeletable()) {
		throw new AuraHandledException('vous ne pouvez pas faire cette action');
	}
	delete itemToDelete;
}

public static Boolean isAdmin() {
	if (!Schema.sObjectType.Profile.isAccessible()) {
		throw new AuraHandledException('Vous n\'avez pas les permissions nécessaires pour accéder aux profils.');
	}

	try {
		return [SELECT Id
		        FROM PermissionSetAssignment
		        WHERE AssigneeId = : UserInfo.getUserId()
		                           AND PermissionSet.PermissionsModifyAllData = true
		                                                                        AND PermissionSet.PermissionsViewAllData = true].size() > 0;
	} catch (Exception e) {
		throw new AuraHandledException('Error checking admin profile: ' + e.getMessage());
	}
}


public static void updateOpportunityProduct(OpportunityLineItem opportunityLineItem) {

	Boolean isAdmin = isAdmin();

	if (!Schema.sObjectType.OpportunityLineItem.isUpdateable() || !isAdmin) {
		throw new AuraHandledException('Vous n\'avez pas les permissions nécessaires pour mettre à jour les Opportunity Line Items.');
	}

	if (!Schema.sObjectType.Product2.isUpdateable()) {
		throw new AuraHandledException('Vous n\'avez pas les permissions nécessaires pour mettre à jour les Produits.');
	}

	// Vérifier que l'Id est présent
	if (opportunityLineItem == null || opportunityLineItem.Id == null) { // Si l'une de ces conditions est vraie, cela signifie que l'objet OpportunityLineItem n'est pas valide pour la mise à jour.
		throw new AuraHandledException('L\'ID de l\'Opportunity Line Item est requis pour la mise à jour.');
	}

	try {
		Product2 productToUpdate = [SELECT Id, QuantityInStock__c FROM Product2 WHERE Id = : opportunityLineItem.Product2Id LIMIT 1];
		productToUpdate.QuantityInStock__c = opportunityLineItem.Quantity;
		update productToUpdate;

	} catch (DmlException e) {
		throw new AuraHandledException('Error updating Opportunity Product: ' + e.getMessage());
	} catch (Exception e) {
		throw new AuraHandledException('An unexpected error occurred: ' + e.getMessage());
	}
}


}