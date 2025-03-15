/**
 * This class contains unit tests for validating the behavior of Apex classes
 * and triggers.
 *
 * Unit tests are class methods that verify whether a particular piece
 * of code is working properly. Unit test methods take no arguments,
 * commit no data to the database, and are flagged with the testMethod
 * keyword in the method definition.
 *
 * All test methods in an org are executed whenever Apex code is deployed
 * to a production org to confirm correctness, ensure code
 * coverage, and prevent regressions. All Apex classes are
 * required to have at least 75% code coverage in order to be deployed
 * to a production org. In addition, all triggers must have some code coverage.
 * 
 * The @isTest class annotation indicates this class only contains test
 * methods. Classes defined with the @isTest annotation do not count against
 * the org size limit for all Apex scripts.
 *
 * See the Apex Language Reference for more information about Testing and Code Coverage.
 */
@IsTest
private class OpportunityProductSelectorTests {


    @TestSetup
    static void makeData(){
        OpportunityLineItem testOppLineItem = OpportunityProductTestFactory.createTestOpportunityLineItem();
    }
   
    @IsTest
    static void testGetOppLineItem(){
        Opportunity testOpp = [SELECT Id FROM Opportunity LIMIT 1];
        Test.startTest();
        List<OpportunityLineItem> results = OpportunityProductSelector.findProductsByOpp(testOpp.Id);
        Test.stopTest();
        Assert.areNotEqual(0, results.size(), 'Should return at least one OppLineItem');
    }
    
    @IsTest
    static void testDeleteItem(){
        OpportunityLineItem testOppLineItem = [SELECT Id FROM OpportunityLineItem LIMIT 1];
        Assert.isNotNull(testOppLineItem, 'Should return at least one OppLineItem');
        Test.startTest();
        OpportunityProductSelector.deleteItem(testOppLineItem.Id);
        Test.stopTest();
        List<OpportunityLineItem> deletedOppLineItem = [SELECT Id FROM OpportunityLineItem WHERE Id =:testOppLineItem.Id];
        Assert.areEqual(0, deletedOppLineItem.size(), 'Should not return the deleted OppLineItem');
    }

    @IsTest
    static void testIsUserCommercialFailure() {
        
        // Création d'un profil de test différent de 'Commercial'. S'assure que même si l'utilisateur a toutes les permissions nécessaires, s'il n'a pas le bon profil (c'est-à-dire "Commercial")
        Profile otherProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
            
        User otherUser = new User(
                Alias = 'ouser',
                Email = 'otheruserOk@test.com',
                EmailEncodingKey = 'UTF-8',
                LastName = 'TestUserOk',
                LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US',
                ProfileId = otherProfile.Id,
                TimeZoneSidKey = 'America/Los_Angeles',
                UserName = 'otheruserOk@test.com'
            );
        insert otherUser;

        // Test en exécutant comme le nouvel utilisateur de test
        System.runAs(otherUser) {
            Test.startTest();
            Boolean result = OpportunityProductSelector.isAdmin();
            // Vérifier que le résultat est false car l'utilisateur n'a pas le profil 'Commercial'
            System.assertEquals(false, result, 'L\'utilisateur sans le profil Commercial doit retourner false.');
            Test.stopTest();     
        }
    }
    

    @IsTest
    static void testIsUserCommercialNoAccess() {
        Profile restrictedProfile = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce' LIMIT 1]; // Modif ici 

        // Crée un utilisateur de test avec ce profil
        User restrictedUser = new User(
            Alias = 'ruser',
            Email = 'restricteduser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'RestrictedUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = restrictedProfile.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'restricteduser@test.com'
        );
        insert restrictedUser;

        // Test en exécutant comme le nouvel utilisateur de test avec des accès restreints
        System.runAs(restrictedUser) {
            Test.startTest();
            try {
                OpportunityProductSelector.isAdmin();
                System.assert(false, 'Exception should have been thrown due to lack of access to Profile.');
            } catch (AuraHandledException e) {
                System.assertEquals('Vous n\'avez pas les permissions nécessaires pour accéder aux profils.', e.getMessage(), 'The exception message should match.');
            } catch (Exception e) {
                System.assert(false, 'Une exception inattendue a été levée : ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    // Nouvelles Methodes pour updateOpportunityProduct

    @IsTest
    static void testUpdateOpportunityProductSuccess() {
        // Crée un utilisateur de test avec le profil "System Administrator"
        Profile adminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];

        User adminUser = new User(
            Alias = 'auser',
            Email = 'adminuser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'AdminUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = adminProfile.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'adminusertestok@test.com'
        );
        insert adminUser;

        System.runAs(adminUser) {
            try {
                // Création des données de test
                Account testAccount = OpportunityProductTestFactory.createTestAccount();
                OpportunityLineItem oli = OpportunityProductTestFactory.createTestOpportunityLineItem();

                // Modifie la quantité pour tester la mise à jour
                oli.Quantity = 150.0;

                // Exécution de la méthode à tester
                Test.startTest();
                OpportunityProductSelector.updateOpportunityProduct(oli);
                Test.stopTest();

                // Vérification que la quantité en stock a été mise à jour
                Product2 updatedProduct = [SELECT QuantityInStock__c FROM Product2 WHERE Id = :oli.Product2Id LIMIT 1][0];
                System.assertEquals(150.0, updatedProduct.QuantityInStock__c, 'La quantité en stock devrait être mise à jour à 150.0.');
            } catch (Exception e) {
                System.debug('Exception dans testUpdateOpportunityProduct_success: ' + e.getMessage());
                System.assert(false, 'Une exception ne devrait pas être levée dans ce test.');
            }
        }
    }

    @IsTest
    static void testUpdateOpportunityProductNoAdmin() {
        // Crée un utilisateur de test avec un profil autre que "System Administrator"
        Profile standardProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        User standardUser = new User(
            Alias = 'suser',
            Email = 'standarduser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StandardUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = standardProfile.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'standardusertest@test.com'
        );
        insert standardUser;

        System.runAs(standardUser) {
            Test.startTest();
            try {
                OpportunityLineItem oli = new OpportunityLineItem();
                OpportunityProductSelector.updateOpportunityProduct(oli);
                System.assert(false, 'Exception should have been thrown due to non-admin user.');
            } catch (AuraHandledException e) {
                System.assertEquals(null, 'Seuls les utilisateurs ayant le profil "Administrateur Système" sont autorisés à effectuer cette modification. Si Vous souhaitez modifier la quantité en Stock, contactez votre Administrateur Système.', e.getMessage());
            }
            Test.stopTest();
        }
    }
 

    @IsTest
    static void testUpdateOpportunityProductNullId() {
        // Crée un utilisateur de test avec le profil "System Administrator"
        Profile adminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];

        User adminUser = new User(
            Alias = 'auser',
            Email = 'adminuser2@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'AdminUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = adminProfile.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'adminuser2test@test.com'
        );
        insert adminUser;
        
        System.runAs(adminUser) {
            Test.startTest();
            try {
                OpportunityLineItem oli = new OpportunityLineItem();
                OpportunityProductSelector.updateOpportunityProduct(oli);
                System.assert(false, 'Exception should have been thrown due to null OpportunityLineItem ID.');
            } catch (AuraHandledException e) {
                System.assertEquals(null, 'L\'ID de l\'Opportunity Line Item est requis pour la mise à jour.', e.getMessage());
            }
            Test.stopTest();
        }
    }
}