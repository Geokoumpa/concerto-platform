/*
Concerto Platform - Online Adaptive Testing Platform
Copyright (C) 2011-2012, The Psychometrics Centre, Cambridge University

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; version 2
of the License, and not any of the later versions.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

function OModule() {};

OModule.inheritance=function(obj)
{
    obj.currentID=0;
    obj.listLength=10;
    obj.reloadOnModification=false;
    obj.reloadHash="";
    obj.currentPanel = "list";
    
    obj.uiChangeListLength=function(length)
    {
        this.listLength=length;
    };
	
    obj.uiReload=function(oid)
    {
        this.uiEdit(oid);
        this.uiList();
    };
        
    obj.highlightCurrentElement=function()
    {
        $(".row"+this.className+" td").removeClass("ui-state-highlight");
        $("#row"+this.className+this.currentID+" td").addClass("ui-state-highlight");
    };
    
    obj.uiAdd=function(ignoreOnBefore)
    {
        if(ignoreOnBefore==null) ignoreOnBefore=false;
        var thisClass = this;
        if(thisClass.onBeforeAdd && !ignoreOnBefore) {
            if(!thisClass.onBeforeAdd()) return;
        }
        
        if(this.currentID!=0) this.uiEdit(0);
        
        Methods.modalLoading();
        $.post("view/"+this.className+"_form.php",{
            oid:-1
        },function(data){
            $("#divAddFormDialog").html(data);
            $("#divAddFormDialog").dialog({
                modal:true,
                resizable:false,
                title:dictionary["s7"],
                width:400,
                open:function(){
                    Methods.stopModalLoading();
                    if(thisClass.onAfterAdd) thisClass.onAfterAdd();
                },
                buttons:[
                {
                    text:dictionary["s95"],
                    click:function(){
                        thisClass.uiSave();
                    }
                },
                {
                    text:dictionary["s23"],
                    click:function(){
                        $(this).dialog("close");
                    }
                }
                ]
            })
        });
    }
    
    obj.uiShowForm=function(){
        if(this.currentPanel=="form") return;
        $("#div"+this.className+"List").hide();
        $("#div"+this.className+"Form").show();
        $("#radio"+this.className+"List").removeAttr("checked");
        $("#radio"+this.className+"Form").attr("checked","checked");
        $( "#div"+this.className+"RadioMenu" ).buttonset("refresh"); 
        this.currentPanel="form";
    }
    
    obj.uiShowList=function(){
        if(this.currentPanel=="list") return;
        $("#div"+this.className+"Form").hide();
        $("#div"+this.className+"List").show();
        $("#radio"+this.className+"Form").removeAttr("checked");
        $("#radio"+this.className+"List").attr("checked","checked");
        $( "#div"+this.className+"RadioMenu" ).buttonset("refresh"); 
        this.currentPanel="list";
    }
	
    obj.uiEdit=function(oid,ignoreOnBefore)
    {
        if(ignoreOnBefore==null) ignoreOnBefore=false;
        var thisClass = this;
        if(thisClass.onBeforeEdit && !ignoreOnBefore) {
            if(!thisClass.onBeforeEdit()) return;
        }
		
        this.currentID=oid;
        
        if(this.currentID>0) {
            $("#radio"+this.className+"Form").button("enable");
            $("#radio"+this.className+"Form").button("option","label",dictionary["s338"]+" #"+this.currentID);
            this.uiShowForm();
        }
        else {
            $("#radio"+this.className+"Form").button("disable");
            $("#radio"+this.className+"Form").button("option","label",dictionary["s338"]+" "+dictionary["s73"]);
            this.uiShowList();
        }
        
        $("#div"+thisClass.className+"Form").mask(dictionary["s319"]);
        $.post("view/"+this.className+"_form.php",
        {
            oid:oid
        },
        function(data){
            $("#div"+thisClass.className+"Form").unmask();
            $("#div"+thisClass.className+"Form").html(data);
            thisClass.highlightCurrentElement();
            if(thisClass.onAfterEdit) thisClass.onAfterEdit();
        });
    };
	
    obj.uiList=function()
    {
        var thisClass = this;
        $('#div'+thisClass.className+'List').mask(dictionary["s319"]);
        $.post("view/list.php",{
            oid:thisClass.currentID,
            class_name:thisClass.className,
            list_length:thisClass.listLength
        },
        function(data)
        {
            $('#div'+thisClass.className+'List').unmask();
            $('#div'+thisClass.className+'List').html(data);
            thisClass.highlightCurrentElement();
            if(thisClass.onAfterList) thisClass.onAfterList();
        });
    };
	
    obj.uiDelete=function(oid,ignoreOnBefore)
    {
        if(ignoreOnBefore==null) ignoreOnBefore=false;
        var thisClass = this;
        
        if(thisClass.onBeforeDelete && !ignoreOnBefore) {
            if(!thisClass.onBeforeDelete(oid)) return;
        }
        
        Methods.confirm(dictionary["s8"].format(oid),null,function(){
            if(thisClass.reloadOnModification) { 
                Methods.modalLoading();
            }
            
            if(oid==thisClass.currentID && !thisClass.reloadOnModification) thisClass.uiEdit(0);
            $.post("query/delete_object.php",
            {
                class_name:thisClass.className,
                oid:oid
            },
            function(data)
            {
                if(thisClass.reloadOnModification) Methods.stopModalLoading();
                switch(data.result){
                    case 0:{
                        if(!thisClass.reloadOnModification) {
                            thisClass.uiList();
                            if(thisClass.onAfterDelete) thisClass.onAfterDelete();
                        }
                        else {
                            Methods.modalLoading();
                            Methods.reload(thisClass.reloadHash);
                        }
                        break;
                    }
                    case -1:{
                        Methods.alert(dictionary["s278"], "alert", dictionary["s273"],function(){
                            Methods.modalLoading();
                            Methods.reload(thisClass.reloadHash); 
                        });
                        break;
                    }
                    case -2:{
                        Methods.alert(dictionary["s81"], "alert", dictionary["s273"]);
                        break;
                    }
                }
            },"json");
        });
    };
    
    obj.uiImport=function(){
        var thisClass = this;
        $("#div"+this.className+"DialogImport").dialog({
            title:dictionary["s268"],
            modal:true,
            resizable:false,
            minHeight: 50,
            close:function(){
            },
            beforeClose:function(){
            
            },
            open:function(){
                $('#file'+thisClass.className+'Import').fileupload({
                    dataType: 'json',
                    url: 'js/lib/fileupload/php/index.php',
                    formData:function(form){
                        return [{
                            name:"class_name",
                            value:thisClass.className
                        }]  
                    },
                    done: function (e, data) {
                        $.each(data.result, function (index, file) {
                            Table.isFileUploaded = true;
                            Methods.confirm(dictionary["s269"], dictionary["s29"], function(){
                                $("#div"+thisClass.className+"DialogImport").parent().mask(dictionary["s319"]);
                                $.post("query/import_object.php",{
                                    class_name:thisClass.className,
                                    file:file.name
                                },function(data){
                                    $("#div"+thisClass.className+"DialogImport").parent().unmask();
                                    $("#div"+thisClass.className+"DialogImport").dialog("close");
                                    switch(data.result){
                                        case 0:{
                                            Methods.alert(dictionary["s270"], "info", dictionary["s268"]);
                                            thisClass.uiReload(data.oid);
                                            break;
                                        }
                                        case -1:{
                                            Methods.alert(dictionary["s278"], "alert", dictionary["s268"]);
                                            location.reload();
                                            break;
                                        }
                                        case -2:{
                                            Methods.alert(dictionary["s81"], "alert", dictionary["s268"]);
                                            break;
                                        }
                                        case -3:{
                                            Methods.alert(dictionary["s271"], "alert", dictionary["s268"]);
                                            break;
                                        }
                                        case -4:{
                                            Methods.alert(dictionary["s333"], "alert", dictionary["s268"]);
                                            break;
                                        }
                                    }
                                },"json");
                            });
                        });
                    }
                });
            },
            buttons:[{
                text:dictionary["s23"],
                click:function(){
                    $(this).dialog("close");
                }
            }]
        }); 
    }
    
    obj.uiExport=function(oid){
        location.href="query/export_object.php?class_name="+this.className+"&oid="+oid;
    };
    
    obj.uiSaveValidated=function(ignoreOnBefore){
        var thisClass = this;
            
        if(thisClass.onBeforeSave && !ignoreOnBefore) {
            if(!thisClass.onBeforeSave()) return;
        }
		
        if(thisClass.reloadOnModification) { 
            Methods.modalLoading();
        }
        
        $("#divAddFormDialog").parent().mask(dictionary["s319"]);
        $("#div"+thisClass.className+"Form").mask(dictionary["s319"]);
        $.post("query/save_object.php",
            (this.currentID==0?this.getAddSaveObject():this.getFullSaveObject()),
            function(data)
            {
                $("#divAddFormDialog").parent().unmask();
                $("#div"+thisClass.className+"Form").unmask();
                if(thisClass.currentID==0) $("#divAddFormDialog").dialog("close");
                
                if(thisClass.reloadOnModification) { 
                    Methods.stopModalLoading();
                }
                
                switch(data.result){
                    case 0:{
                        if(data.oid!=0)
                        {
                            if(!thisClass.reloadOnModification) { 
                                if(thisClass.currentID!=0) thisClass.uiList();
                                else thisClass.uiReload(data.oid);
                                if(thisClass.onAfterSave) thisClass.onAfterSave();
                            }
                            Methods.alert(dictionary["s9"],"info", dictionary["s274"],function(){
                                if(thisClass.reloadOnModification) {
                                    Methods.modalLoading();
                                    Methods.reload(thisClass.reloadHash);
                                }
                            });
                        }
                        else {
                            Methods.alert(dictionary["s10"],"alert", dictionary["s274"]);
                        }
                        break;
                    }
                    case -1:{
                        Methods.alert(dictionary["s278"], "alert", dictionary["s274"],function(){
                            Methods.modalLoading();
                            Methods.reload(thisClass.reloadHash); 
                        });
                        break;     
                    }
                    case -2:{
                        Methods.alert(dictionary["s81"], "alert", dictionary["s274"]);
                        break;     
                    }
                }
            },"json");
    }
	
    obj.uiSave=function(ignoreOnBefore)
    {
        if(ignoreOnBefore==null) ignoreOnBefore=false;
        var thisClass = this;
        
        if(thisClass.uiSaveValidate) thisClass.uiSaveValidate(ignoreOnBefore);
        else thisClass.uiSaveValidated(ignoreOnBefore);
    };
};