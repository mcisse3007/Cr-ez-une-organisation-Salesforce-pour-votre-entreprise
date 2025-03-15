trigger OpportunityLineItemTrigger on OpportunityLineItem (after insert, after update, after delete) {

    List<OpportunityLineItem> opps = Trigger.new;
    if(opps != null && opps.size()> 0){
        EventBus.publish(new OpportunityProductUpdate_e__e(
            Opportunity_Id_c__c = opps[0].OpportunityId));
    }
    
}