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

    function isPhysicianReferralVisible() 
    {
        return GC.App.getViewType() == "referral";
    }

    

    function renderPhysicianReferral( container ) 
    {
       
        

        $(container).empty();

        

        //hardcoded for now
        var patientId = 18791941;
    
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
      

        $(container).append("<h1 style='font-size: 28px; font-weight:bold;'>Patient View</h1>");
        $(container).append("<h1>Patient: " + patientId + "</h1>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Recommendations based on questionnaire: </h1>");

        $(container).append("<textarea rows='5' cols='50'>Recommendations:</textarea>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Physician recommendations (ICD-10): </h1>");

        $(container).append("<textarea rows='5' cols='50'>ICD-10 codes:</textarea>");
        $(container).append("<br></br>");

        $(container).append("<h1 style='font-size: 20px; font-weight:bold;'>Lab Test Recommendations: </h1>");

        $(container).append("<textarea rows='5' cols='50'>Lab-based Referrals:</textarea>");
        $(container).append("<br></br>");

        $(container).append("<h1>Order the following lab tests:</h1>");
        $(container).append("<h1>Body fat test</h1>");
        $(container).append("<br></br>");

        $(container).append("<button style='height: 30px; background-color: #bbccff;padding:5px;'>Export Data</button>");
        $(container).append("<button style='height: 30px; background-color: #bbccff;padding:5px;'>Submit Referrals</button>");

    }

    

    NS.PhysicianRecord = 
    {
        render : function() 
        {

                renderPhysicianReferral("#view-referral");

        }
    };

    $(function() 
    {
        if (!PRINT_MODE) 
        {

            $("html").bind("set:viewType set:language", function(e) 
            {
                if (isPhysicianReferralVisible()) 
                {
                    renderPhysicianReferral("#view-referral");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) 
            {
                if (isPhysicianReferralVisible()) 
                {
                    renderPhysicianReferral("#view-referral");
                }
            });

            GC.Preferences.bind("set", function(e) 
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") 
                {
                    if (isPhysicianReferralVisible()) 
                    {
                        renderPhysicianReferral("#view-referral");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e) 
            {
                renderPhysicianReferral("#view-referral");
            });

       }
    });

}(GC, jQuery));
