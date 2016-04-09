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

    function isPhysicianViewVisible() 
    {
        return GC.App.getViewType() == "view";
    }

    

    function renderPhysicianView( container ) 
    {
       
        console.log("deeeeeeeeeeeeeeeeebug 2222222222222");

        $(container).empty();

        var str = $("<h1>hello world</h1>");

        $(container).append(str);

        //hardcoded for now
        var patientId = 18791941;
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
      


        $.ajax
        ({

            url: 'http://52.72.172.54:8080/fhir/baseDstu2/QuestionnaireResponse?patient=' 
            + patientId ,

            dataType: 'json',

            success: function(questionareResult) { mergeHTML(questionareResult, true, container);}
                    
        });


        
        

        console.log("deeeeeeeeeeeeeeeeebug 333333");
       
    }


    function mergeHTML(questionareResult, initialCall, container) 
    {
        if (!questionareResult) 
            return;
        
        if (questionareResult.data) 
        {
            questionareResult = questionareResult.data;
        }

        console.log(questionareResult.entry);
        
        for (var i = 0; i < questionareResult.entry.length; i++) 
        {
            
            var p = questionareResult.entry[i];
            
            console.log(p); 

            if (p.resource.group.question) 
            {
                for (var ind = 0; ind < p.resource.group.question.length ; ind++) 
                {

                    var rdata = 
                    [
                        "QUESTION " + ind 

                        +

                        ((p.resource.group.question[ind]) ?

                            ((p.resource.group.question[ind].answer) ?
                                p.resource.group.question[ind].answer + ", " 
                                : 
                                "Not known, ")     
                        :      
                        "Not known")
                    ]

                    $(container).append(rdata);
                }
            } 
   
        }

        


        if (initialCall) 
        {
            getMultiResults(questionareResult);
        }
    }
     
    function getMultiResults(questionareResult) 
    {
        var nResults = questionareResult.total;
    
        var lookingForMore = false;
    
        for (var ind = 0; ind < (questionareResult.link ? questionareResult.link.length : 0); ind++) 
        {
            if (questionareResult.link[ind].relation == "next") 
            {
                var theURL = questionareResult.link[ind].url;
            
                console.log("url " + theURL);
            
                var a = $('<a>', { href:theURL } )[0];
            
                var que = a.search.substring(1);
            
                var quedata = que.split("&");
            
                for (var qind = 0; qind < quedata.length; qind++) 
                {
                    var item = quedata[qind].split("=");
                
                    if ((item[0] === "_getpagesoffset") && (parseInt(item[1]) < nResults)) 
                    {
                        var nRequests = 0;
                        
                        for (var offsetResults = parseInt(item[1]); offsetResults < nResults; offsetResults += 50) 
                        {
                            lookingForMore = true;
                        
                            var newURL = theURL.replace(/(_getpagesoffset=)(\d+)/, '$1' + offsetResults.toString());
                           
                            console.log("rewritten to " + newURL);
                           
                            nRequests++;
                            
                            $.ajax
                            ({
                                dataType: "json",
                                url: newURL,
                                success: function (newResult) 
                                {
                                    console.log(newResult);
                                    
                                    mergeHTML(newResult, false);
                                    
                                }
                            });
                        }
                    }
                }
                break;
            }
        }
        
        if (lookingForMore) 
        {
            $(document).ajaxStop
                (
                    function() 
                    { 
                        

                    }

                );
        } 
        else 
        {
           
        }
    }




    NS.PhysicianView = 
    {
        render : function() 
        {

                renderPhysicianView("#view-physician");

        }
    };

    $(function() 
    {
        if (!PRINT_MODE) 
        {

            $("html").bind("set:viewType set:language", function(e) 
            {
                if (isPhysicianViewVisible()) 
                {
                    renderPhysicianView("#view-physician");
                }
            });

            GC.Preferences.bind("set:metrics set:nicu set:currentColorPreset", function(e) 
            {
                if (isPhysicianViewVisible()) 
                {
                    renderPhysicianView("#view-physician");
                }
            });

            GC.Preferences.bind("set", function(e) 
            {
                if (e.data.path == "roundPrecision.velocity.nicu" ||
                    e.data.path == "roundPrecision.velocity.std") 
                {
                    if (isPhysicianViewVisible()) 
                    {
                        renderPhysicianView("#view-physician");
                    }
                }
            });


            GC.Preferences.bind("set:timeFormat", function(e) 
            {
                renderPhysicianView("#view-physician");
            });

       }
    });

}(GC, jQuery));
