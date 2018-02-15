Ext.define('Gnt.examples.msproject_import.data.ux.Importer', {
    extend          : 'Ext.AbstractPlugin',

    alias           : 'plugin.msproject_importer',

    taskStore       : null,
    dependencyStore : null,
    assignmentStore : null,
    resourceStore   : null,
    calendarManager : null,

    taskMap         : null,
    resourceMap     : null,

    syncBlock : function () {
        return false;
    },

    init : function (gantt) {
        this.taskStore = gantt.taskStore;
        this.dependencyStore = gantt.dependencyStore;
        this.resourceStore = gantt.resourceStore;
        this.assignmentStore = gantt.assignmentStore;
        this.calendarManager = this.taskStore.calendarManager;

        this.taskModelIdProperty = this.taskStore.model.prototype.idProperty;
        this.resourceModelIdProperty = this.resourceStore.model.prototype.idProperty;
        this.assignmentModelIdProperty = this.assignmentStore.model.prototype.idProperty;
        this.assignmentModelTaskIdProperty = this.assignmentStore.model.prototype.taskIdField;
        this.assignmentModelResourceIdProperty = this.assignmentStore.model.prototype.resourceIdField;
        this.dependencyModelIdProperty = this.dependencyStore.model.prototype.idProperty;
        this.dependencyModelFromProperty = this.dependencyStore.model.prototype.fromField;
        this.dependencyModelToProperty = this.dependencyStore.model.prototype.toField;

        // if we have CalendarManager onboard we do calendars importing as well
        if (this.calendarManager) {
            this.calendarModelIdProperty = this.calendarManager.model.prototype.idProperty;
            this.taskModelCalendarIdProperty = this.taskStore.model.prototype.CalendarIdField;
            this.resourceModelCalendarIdProperty = this.resourceStore.model.prototype.CalendarIdField;
        }
    },

    /*
     * @param {Object} data A custom data set with 'tasks', 'dependencies', 'assignments' and 'resources' properties.
     * */
    importData : function (data) {
        this.calendarMap = {};
        this.taskMap = {};
        this.resourceMap = {};
        this.projectCalendar = null;

        var taskStore = this.taskStore;

        taskStore.on('beforesync', this.syncBlock);

        taskStore.suspendEarlyDatesResetNotification();
        taskStore.suspendLateDatesResetNotification();

        // import calendars if we have CalendarManager
        this.calendarManager && this.processCalendars(data);

        var tasks = this.getTaskTree(Ext.isArray(data.tasks) ? data.tasks : [data.tasks]);

        this.processResources(data);
        this.processDependencies(data);
        this.processAssignments(data);

        var newRoot = Ext.isArray(data.tasks) ? {} : tasks[0];
        newRoot.children = tasks;

        if (newRoot.isNode) {
            // TODO: set root node id to "root" to comply w/ server side demos
            newRoot.setId('root');
            // seems extjs doesn't track root id change and children keep parentId intact
            Ext.Array.each(newRoot.childNodes, function (node) { node.data.parentId = 'root'; });

            // if instance is passed then getTreeStore will return null
            // http://www.sencha.com/forum/showthread.php?297640
            newRoot.join(taskStore);
        }

        // set project calendar if it's provided
        // we set project calendar in silent mode to not readjust all the tasks
        this.projectCalendar && taskStore.setCalendar(this.calendarMap[this.projectCalendar].getCalendar(), true);

        taskStore.setRoot(newRoot);

        taskStore.un('beforesync', this.syncBlock);

        taskStore.resumeEarlyDatesResetNotification();
        taskStore.resumeLateDatesResetNotification();
    },

    /* RESOURCES */
    processResources : function(data) {
        var resources = [];

        Ext.Array.map(data.resources, this.processResource, this);

        this.resourceStore.loadData(resources);
    },

    processResource : function (resData) {
        var id = resData[this.resourceModelIdProperty];
        delete resData[this.resourceModelIdProperty];

        resData[this.resourceModelCalendarIdProperty] = this.calendarMap[resData[this.resourceModelCalendarIdProperty]];

        var resource = new this.resourceStore.model(resData);

        this.resourceMap[id] = resource;
        return resource;
    },
    /* EOF RESOURCES */

    /* DEPENDENCIES */
    processDependencies : function(data) {
        var deps = Ext.Array.map(data.dependencies, this.processDependency, this);

        this.dependencyStore.loadData(deps);
    },

    processDependency : function (depData) {
        var fromId = depData[this.dependencyModelFromProperty];
        var toId = depData[this.dependencyModelToProperty];
        delete depData[this.dependencyModelFromProperty];
        delete depData[this.dependencyModelToProperty];
        delete depData[this.dependencyModelIdProperty];
        var dep = new this.dependencyStore.model(depData);

        dep.setSourceTask(this.taskMap[fromId]);
        dep.setTargetTask(this.taskMap[toId]);

        return dep;
    },
    /* EOF DEPENDENCIES */

    /* ASSIGNMENTS */
    processAssignments : function(data) {
        Ext.Array.each(data.assignments, this.processAssignment, this);
    },

    processAssignment: function (asData) {
        var resourceId  = asData[this.assignmentModelResourceIdProperty];
        var taskId      = asData[this.assignmentModelTaskIdProperty];
        delete asData[this.assignmentModelIdProperty];
        delete asData[this.assignmentModelResourceIdProperty];
        delete asData[this.assignmentModelTaskIdProperty];

        this.taskMap[taskId].assign(this.resourceMap[resourceId], asData.Units);
    },
    /* EOF ASSIGNMENTS */

    /* TASKS  */
    getTaskTree : function (tasks) {
        return Ext.Array.map(tasks, this.processTask, this);
    },

    processTask : function (data) {
        var id = data[this.taskModelIdProperty];
        var children = data.children;

        delete data.children;
        delete data[this.taskModelIdProperty];

        data[this.taskModelCalendarIdProperty] = this.calendarMap[data[this.taskModelCalendarIdProperty]];

        var t = new this.taskStore.model(data);
        t.taskStore = this.taskStore;

        if (children) {
            t.appendChild(this.getTaskTree(children));
        }

        t._Id = id;
        this.taskMap[t._Id] = t;

        return t;
    },
    /* EOF TASKS  */

    /* CALENDARS */
    processCalendarChildren : function (children) {
        return Ext.Array.map(children, this.processCalendar, this);
    },

    processCalendar : function (data) {
        var id = data[this.calendarModelIdProperty];
        var children = data.children;

        delete data.children;
        delete data[this.calendarModelIdProperty];

        var t = new this.calendarManager.model(data);

        if (children) {
            t.appendChild(this.processCalendarChildren(children));
        }

        t._Id = id;
        this.calendarMap[t._Id] = t;

        return t;
    },

    // Entry point of calendars loading
    processCalendars : function (data) {
        var calendarManager = this.calendarManager;

        var metaData = data.calendars.metaData;

        delete data.calendars.metaData;

        var processed = this.processCalendarChildren([ data.calendars ]),
            newRoot   = processed[0];

        if (newRoot.isNode) {
            // TODO: set root node id to "root" to comply w/ server side demos
            newRoot.setId('root');
            // seems extjs doesn't track root id change and children keep parentId intact
            Ext.Array.each(newRoot.childNodes, function (node) { node.data.parentId = 'root'; });

            // if instance is passed then getTreeStore will return null
            // http://www.sencha.com/forum/showthread.php?297640
            newRoot.join(calendarManager);
        }

        calendarManager.setRoot(newRoot);

        // remember passed project calendar identifier ..we will set it later after tasks are loaded
        this.projectCalendar = metaData && metaData.projectCalendar;
    }
    /* EOF CALENDARS */

});