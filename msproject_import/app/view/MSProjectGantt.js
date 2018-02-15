Ext.define('Gnt.examples.msproject_import.view.MSProjectGantt', {
    extend : 'Gnt.panel.Gantt',

    alias  : 'widget.msprojectgantt',

    requires : [
        'Ext.form.Panel',
        'Ext.form.TextField',
        'Ext.form.File',
        'Sch.util.Date',
        'Gnt.data.CalendarManager',
        'Gnt.model.Task',
        'Gnt.data.TaskStore',
        'Gnt.column.Name',
        'Gnt.column.StartDate',
        'Gnt.column.EndDate',
        'Gnt.column.ResourceAssignment',
        'Gnt.column.PercentDone',
        'Gnt.column.AddNew',
        'Gnt.plugin.taskeditor.TaskEditor',
        'Gnt.plugin.TaskContextMenu',
        'Gnt.plugin.DependencyEditor',
        'Sch.plugin.TreeCellEditing',
        'Gnt.examples.msproject_import.model.MSProjectTask',
        'Gnt.examples.msproject_import.data.ux.Importer',
        'Gnt.examples.msproject_import.view.ux.MSImportPanel'
    ],

    plugins: [
        // enables task editing by double clicking, displays a window with fields to edit
        'gantt_taskeditor',
        // enables double click dependency editing
        'gantt_dependencyeditor',
        // shows a context menu when right clicking a task
        'gantt_taskcontextmenu',
        // column editing
        'scheduler_treecellediting',
        {
            id    : 'my-importer', // define identifier to be able to get the plugin instance w/ getPlugin()
            ptype : 'msproject_importer'
        }
    ],

    dependencyViewConfig: {
        overCls : 'dependency-over'
    },

    region            : 'center',
    title             : 'Loading data from MS Project',
    border            : false,
    bodyBorder        : false,
    stripeRows        : true,
    rowHeight         : 31,
    leftLabelField    : {
        dataIndex : 'Name',
        editor    : { xtype : 'textfield' }
    },
    highlightWeekends : true,
    showTodayLine     : true,
    loadMask          : true,
    startDate         : new Date(2012, 4, 1),
    viewPreset        : 'weekAndDayLetter',

    lockedGridConfig : { width : 200 },

    //static column that will be removed when columns from mpp file are loaded
    columns : [
        {
            xtype : 'namecolumn',
            width : 200
        }
    ],

    initComponent : function() {
        var me = this;

        Ext.apply(me, {
            tbar : [
                {
                    xtype     : 'msimportpanel',
                    listeners : {
                        dataavailable : function(form, data) {
                            Ext.Msg.alert('Success', 'Data from .mpp file loaded');

                            // first set new columns extracted from the imported file
                            me.lockedGrid.reconfigure(me.lockedGrid.getStore(), data.columns.concat({ xtype : 'addnewcolumn' }));

                            // load data into the relevant stores
                            me.getPlugin('my-importer').importData(data);

                            me.taskStore.getRoot().expand();

                            var span = me.taskStore.getTotalTimeSpan();
                            if (span.start && span.end) {
                                me.setTimeSpan(span.start, span.end);
                            }
                        }
                    }
                }
            ]
        });

        me.callParent();
    }
});