Ext.define('Gnt.examples.msproject_import.model.MSProjectTask', {
    extend          : 'Gnt.model.Task',
    inclusiveEndDate: true,

    isMilestone: function() {
        return this.get('Milestone');
    }
});