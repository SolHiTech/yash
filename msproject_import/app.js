Ext.application({
    name     : 'Gnt.examples.msproject_import',
    //appFolder: 'app',
    requires : [
        'Gnt.examples.msproject_import.view.MSProjectGantt'
    ],
    launch   : function() {
        var taskStore = new Gnt.data.TaskStore({
            model                            : 'Gnt.examples.msproject_import.model.MSProjectTask',

            // provide "calendarManager" to support calendars import
            calendarManager                  : new Gnt.data.CalendarManager(),

            // Schedule by constraints like MS Project does
            scheduleByConstraints            : true,
            // Activate UI to warn on:
            // - violating dependencies
            // - potential scheduling conflicts
            checkDependencyConstraint        : true,
            checkPotentialConflictConstraint : true,

            root                       : {
                children : [
                    {
                        Name      : 'Hello World',
                        StartDate : new Date(2012, 4, 1),
                        EndDate   : new Date(2012, 4, 3),
                        leaf      : true
                    }
                ]
            }
        });

        new Ext.Viewport({
            layout: 'border',

            items: [
                {
                    xtype     : 'msprojectgantt',
                    taskStore : taskStore,
                    endDate   : Sch.util.Date.add(new Date(2012, 4, 1), Sch.util.Date.WEEK, 20)
                },
                {
                    xtype: 'details'
                }
            ]
        });
    }
});
