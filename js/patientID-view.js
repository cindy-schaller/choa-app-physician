

(function(NS, $) 
{

    "use strict";
    
       

    var selectedIndex = -1,

        /**
         * The cached value from GC.App.getMetrics()
         */
        metrics = null,

        PRINT_MODE = $("html").is(".before-print"),

        EMPTY_MARK = PRINT_MODE ? "" : "&#8212;",

        MILISECOND = 1,
        SECOND     = MILISECOND * 1000,
        MINUTE     = SECOND * 60,
        HOUR       = MINUTE * 60,
        DAY        = HOUR * 24,
        WEEK       = DAY * 7,
        MONTH      = WEEK * 4.348214285714286,
        YEAR       = MONTH * 12,

        shortDateFormat = 
        {
            "Years"   : "y",
            "Year"    : "y",
            "Months"  : "m",
            "Month"   : "m",
            "Weeks"   : "w",
            "Week"    : "w",
            "Days"    : "d",
            "Day"     : "d",
            separator : " "
        };

     function isPatientsViewVisible() {
        return GC.App.getViewType() == "patients";
    }
    

    
     function renderPatientsView( container ) {
        
        var current_patientID = window.sessionStorage.getItem('patientid_global');
    
        $(container).empty();

        var PatientIDradio_buttons = "";
        
        PatientIDradio_buttons +=("<form id='patientIDform'>");

        if(current_patientID == '11034584')
        {
            PatientIDradio_buttons +=("<input type='radio' name='myRadio' value='11034584' checked/> Clark Kent <br />");
            PatientIDradio_buttons +=("<input type='radio' name='myRadio' value='11037781' /> Kara Kent <br />");
        }
        else
        {
            PatientIDradio_buttons +=("<input type='radio' name='myRadio' value='11034584' /> Clark Kent <br />");
            PatientIDradio_buttons +=("<input type='radio' name='myRadio' value='11037781' checked/> Kara Kent <br />");
        }

        PatientIDradio_buttons +=("</form>");


        
        $(container).append('<p>&nbsp;</p><p></p>' +PatientIDradio_buttons);

        

        $('#patientIDform input').on('change', function() {

            var checkedValue = $('input[name="myRadio"]:checked', '#patientIDform').val();
            
            if(checkedValue !=  current_patientID)
            {
                window.sessionStorage.setItem('patientid_global',checkedValue );
                alert('A new patient, ID =' + $('input[name="myRadio"]:checked', '#patientIDform').val() + ' has been selected. Please wait a moment while new data is retrieved from the server'  ); 
                window.location.reload(true); 
                //gc_app_js(GC, jQuery);
                //GC.get_data();
                //GC.App.getPatient().refresh();
            }
        });
       
        
    }

    

NS.PatientsView = {
        render : function() {


            renderPatientsView("#view-patients");
            
            
        }
    };

    $(function() {
        if (!PRINT_MODE) {

            $("html").bind("set:viewType set:language", function(e) {
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-patients");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) {
                if (isPatientsViewVisible()) {
                    renderPatientsView("#view-patients");
                }
            });

            GC.Preferences.bind("set", function(e) {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") {
                    if (isPatientsViewVisible()) {
                        renderPatientsView("#view-patients");
                    }
                }
            });

            
            GC.Preferences.bind("set:timeFormat", function(e) {
                renderPatientsView("#view-patients");
            });

           
        }
    });
}(GC, jQuery));
