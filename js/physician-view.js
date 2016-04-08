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
       
        

        $(container).empty();

        

        //hardcoded for now
        var patientId = 18791941;
    
        if(!patientId)
        {
            throw "Patient ID is a required parameter";
        }
      
        $(container).append("<h1> hardcoded patient ID: " + patientId + "<h1>");

        $.ajax
        ({

            url: 'http://52.72.172.54:8080/fhir/baseDstu2/QuestionnaireResponse?patient=' 
            + patientId ,

            dataType: 'json',

            success: function(questionareResult) { mergeHTML(questionareResult,  container);}
                    
        });

        
    }


    function mergeHTML(questionareResult,  container) 
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
            
            var str = "<h1> Healthy Eating Questionare <h1><h1><h1>"

            $(container).append(str);

            var qr = questionareResult.entry[i];

            console.log(qr.resource.questionnaire.reference);
            //  should be "Questionnaire/18791830"
            var Qreference  =   ((qr.resource.questionnaire.reference) ?
                                qr.resource.questionnaire.reference
                                : 
                                "Not known, ")  


            str = "<h1>Questions from Questionnaire ID = " + Qreference + "<h1>"

            $(container).append(str);

            var n = Qreference.search("/");
            var Qid = Qreference.substr(n);

            $.ajax
            ({

                url: 'http://52.72.172.54:8080/fhir/baseDstu2/Questionnaire?_id=' 
                + Qid ,

                dataType: 'json',

                success: function(questionare) { mergeHTML_2 (qr, questionare, container);}
                        
            });
        }
    }

    function mergeHTML_2(questionareResult, questionare, container)   
    {

       

        if (!questionare) 
            return;

        var qr = questionareResult
        var q = questionare

        console.log(qr); 
        console.log(q); 

        if (q.entry[0].resource.group.question) 
        {
            for (var ind = 0; ind < q.entry[0].resource.group.question.length ; ind++) 
            {

                var rdata = 
                [
                    "<h1>"

                    +

                    "QUESTION " + ind + " : " 

                    +

                     ((q.entry[0].resource.group.question[ind].text) ?
                            q.entry[0].resource.group.question[ind].text + " , " 
                            : 
                            "question text Not known, ") 
                    
                    
                    
                    

                ] 
 
                $(container).append(rdata);


                $(container).append("<h1> <h1> answer options : ");

                for (var ind_o = 0; ind_o < q.entry[0].resource.group.question[ind].option.length ; ind_o++) 
                {   

                    var o_data = 
                    [

                        "option # " + ind_o + " : " 

                        +
                            ((q.entry[0].resource.group.question[ind].option[ind_o]) ?
                            q.entry[0].resource.group.question[ind].option[ind_o].display+ " , " 
                            : 
                            "option Not known, ")
  
                    ]     

                    $(container).append(o_data);
                }
                    
                $(container).append("<h1>");

                
            }
        } 

    



        if (qr.resource.group.question) 
        {
            for (var ind = 0; ind < qr.resource.group.question.length ; ind++) 
            {

                var rdata = 
                [
                    "<h1>"

                    +

                    "QUESTION " + ind + " : " 

                    +

                    "linkId : "

                    +

                    ((qr.resource.group.question[ind].linkId) ?
                            qr.resource.group.question[ind].linkId + " , " 
                            : 
                            "Not known, ") 
                    
                    +
                    
                    "answer : "

                    + 

                    ((qr.resource.group.question[ind].answer[0].valueInteger) ?
                           qr.resource.group.question[ind].answer[0].valueInteger  
                           : 
                           "Not known, ")     

                    +
                    "<h1>"
                   
                ]

                $(container).append(rdata);
            }
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
