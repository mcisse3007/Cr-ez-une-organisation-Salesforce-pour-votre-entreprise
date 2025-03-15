public with sharing class SystemProfile {
    @AuraEnabled(cacheable=true)
    public static Profile getSystemProfile() {
     
		Id currentUserId = UserInfo.getUserId();
        if (!Schema.sObjectType.User.fields.Id.isAccessible()) {
            throw new AuraHandledException('vous ne pouvez pas faire cette action');
        }
        User usersRecord = [SELECT ProfileId, Profile.Name FROM User WHERE Id = :currentUserId][0];
		return usersRecord.Profile;
    }
}