@IsTest
public class OpportunityProductTestFactory {

    public static Account createTestAccount() {
        Account acc = new Account(Name = 'Test Account');
        insert acc;
        return acc;
    }
    
    public static OpportunityLineItem createTestOpportunityLineItem() {
        Account testAccount = new Account(
        Name = 'Test Account'
        );
        insert testAccount;

        Pricebook2 standardPricebook = new Pricebook2(
        Id = Test.getStandardPricebookId(),
        IsActive = true
        );

        Update standardPricebook;

        Opportunity opp = new Opportunity(
                Name= 'Test Opportunity',
                StageName= 'Prospecting',
                CloseDate= System.today().addDays(30),
                Amount= 10000,
                AccountId = testAccount.Id,
                Pricebook2Id= standardPricebook.Id
        );
        insert opp;

        Product2 product = new Product2(
            Name = 'Test Product',
            IsActive = true
        );
        insert product;

        PricebookEntry pricebookEntry = new PricebookEntry(
            Pricebook2Id = standardPricebook.Id,
            Product2Id = product.Id,
            UnitPrice = 75000,
            IsActive = true
        );
        insert pricebookEntry;

        OpportunityLineItem oppItem = new OpportunityLineItem(
               UnitPrice= 75000,
               Quantity= 1,
               ServiceDate= System.today().addDays(30),
               OpportunityId= opp.Id,
               PricebookEntryId = pricebookEntry.Id   
        );
        insert oppItem;
        return oppItem;
    }


    public static User createSystemProfile() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User testUser = new User(
            LastName = 'Test',
            Alias = 'tuser',
            Email = 'testuser@example.com',
            Username = 'testuser@example.com',
            ProfileId = p.Id,
            TimeZoneSidKey = 'GMT',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;
        return testUser;
    }
}