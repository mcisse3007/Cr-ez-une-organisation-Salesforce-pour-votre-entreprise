public with sharing class OpportunityProductsController {

    @AuraEnabled(Cacheable=true)
    public static List<OpportunityLineItem> findProductsByOpp(Id opportunityId){

        try {
            return OpportunityProductSelector.findProductsByOpp(opportunityId);
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteItem(Id oppItem){
        OpportunityProductSelector.deleteItem(oppItem);
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isAdmin() {
        return OpportunityProductSelector.isAdmin();
    }

    @AuraEnabled
    public static void updateOpportunityProduct(OpportunityLineItem opportunityLineItem) {
        OpportunityProductSelector.updateOpportunityProduct(opportunityLineItem);
    }

}