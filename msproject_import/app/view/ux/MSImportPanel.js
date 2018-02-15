Ext.define('Gnt.examples.msproject_import.view.ux.MSImportPanel', {
    extend    : 'Ext.form.Panel',
    requires  : [
        'Ext.form.field.File',
        'Ext.button.Button'
    ],
    alias     : 'widget.msimportpanel',
    border    : false,

    defaults  : {
        margin : 5
    },

    layout    : 'hbox',

    submitURL : 'php/load.php',

    initComponent : function () {

        Ext.apply(this, {
            items   : [
                {
                    labelWidth   : 50,
                    allowBlank   : false,
                    xtype        : 'filefield',
                    itemId       : 'form-file',
                    emptyText    : 'Select .mpp file',
                    fieldLabel   : 'File',
                    name         : 'mpp-file',
                    buttonText   : '',
                    buttonConfig : {
                        iconCls  : 'fa fa-folder-open'
                    }
                },
                {
                    xtype    : 'button',
                    text     : 'Load file',
                    formBind : true,
                    handler  : function () {
                        var panel   = this,
                            form    = panel.getForm();

                        if (form.isValid()) {
                            form.submit({
                                url     : this.submitURL,
                                reset   : true,
                                waitMsg : 'Loading data...',

                                failure : function (form, action) {
                                    var msg = (action.result && action.result.msg) || (action.response && action.response.responseText);

                                    Ext.Msg.alert('Import failed', 'Please make sure the input data is valid. Error message: ' + msg);

                                    form.reset();
                                    form.isValid();
                                },
                                success : function (form, action) {
                                    panel.fireEvent('dataavailable', panel, action.result.data);
                                    // form.reset();
                                    form.isValid();
                                }
                            });
                        }
                    },
                    scope : this
                }
            ]
        });

        this.callParent(arguments);
    }
});


