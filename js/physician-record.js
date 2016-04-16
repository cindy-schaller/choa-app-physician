/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
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

    function isPhysicianRecordVisible() 
    {
        return GC.App.getViewType() == "record";
    }

    

    function renderPhysicianRecord( container ) 
    {
       
        

        $(container).empty();

        

        //hardcoded for now
        var patientId = 18791941;
    
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
        $(container).append("<h1 style='font-size: 28px; font-weight:bold;'>Patient Record</h1>");
        $(container).append("<h1 style='font-size: 16px;'>Patient: " + patientId + "</h1>");
        $(container).append("<br></br>");
        
        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Observations: </h1>");

        $(container).append("<textarea rows='6' cols='50'>observations</textarea>");
        $(container).append("<br></br>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Lab Results: </h1>");

        $(container).append("<textarea rows='6' cols='50'>observations</textarea>");
        $(container).append("<br></br>");
        $(container).append("<br></br>");

        $(container).append("<h1>Order the following lab tests:</h1>");
        $(container).append("<h1>Body fat test</h1>");

        
    }

    

    NS.PhysicianRecord = 
    {
        render : function() 
        {

                renderPhysicianRecord("#view-record");

        }
    };

    $(function() 
    {
        if (!PRINT_MODE) 
        {

            $("html").bind("set:viewType set:language", function(e) 
            {
                if (isPhysicianRecordVisible()) 
                {
                    renderPhysicianRecord("#view-record");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) 
            {
                if (isPhysicianRecordVisible()) 
                {
                    renderPhysicianRecord("#view-record");
                }
            });

            GC.Preferences.bind("set", function(e) 
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") 
                {
                    if (isPhysicianRecordVisible()) 
                    {
                        renderPhysicianRecord("#view-record");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e) 
            {
                renderPhysicianRecord("#view-record");
            });

       }
    });

}(GC, jQuery));
