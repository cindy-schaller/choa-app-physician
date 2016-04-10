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
      
        $(container).append("Hardcoded patient ID: <b>" + patientId + "</b></br></br>");

        $.ajax({
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/Patient?_id=' + patientId ,
            dataType: 'json',
            success: function(patientResult) { mergeHTML0(patientResult,container );}
        });
    }


    function mergeHTML0(patientResult,  container) 
    {
         //hardcoded for now
        var patientId = 18791941;

        if (!patientResult) 
            return;

       
        
        if (patientResult.data) 
        {
            patientResult = patientResult.data;
        }

        console.log(patientResult);

        var patientnameF = patientResult.entry[0].resource.name[0].family ;
        var patientnameG = patientResult.entry[0].resource.name[0].given ;
        var patientgender = patientResult.entry[0].resource.gender;
        var patientbirthdate =  patientResult.entry[0].resource.birthDate;
        

         $(container).append("Patient name: <b>" + patientnameG +  " " + patientnameF +  ",  Gender: <b>" + patientgender + ",  Birth date: <b>" + patientbirthdate + "</b></br></br>"); 



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

        //for now just show one
       // for (var i = 0; i < questionareResult.entry.length; i++) 
        {
            
           
            var last = questionareResult.entry.length -1
            var qr = questionareResult.entry[last];

            console.log(qr.resource.questionnaire.reference);
            //  should be "Questionnaire/18791830"
            var Qreference  =   ((qr.resource.questionnaire.reference) ?
                                qr.resource.questionnaire.reference
                                : 
                                "Not known, ")  



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

        var date = qr.resource.meta.lastUpdated
        var str = "<h1><b>Healthy Eating Questionare</b></h1>" +  "Date : " + date  + ""

        $(container).append(str);
       
        str = "<hr>";

        $(container).append(str);

        if (q.entry[0].resource.group.question) 
        {
            for (var ind = 0; ind < q.entry[0].resource.group.question.length ; ind++) 
            {
 
                //so human readable numbers start at 1, not zero
                var human_readable_cnt = ind+1;  
                var rdata = 
                [
                    "</br>" 

                    +
                    
                    "<h2><b>QUESTION " + human_readable_cnt + "</b>: " 
                     

                    +

                     ((q.entry[0].resource.group.question[ind].text) ?
                            q.entry[0].resource.group.question[ind].text + "" 
                            : 
                            "question text Not known, ") 
                    
                    
                    +

                    "</h2>"
                    

                ] 
 
                $(container).append(rdata);


                var o_data_start = "<ul>"
                $(container).append(o_data_start);


                for (var ind_o = 0; ind_o < q.entry[0].resource.group.question[ind].option.length ; ind_o++) 
                {   

                    //so human readable numbers start at 1, not zero
                    var human_readable_ocnt = ind_o+1; 
                    var o_data = 
                    [

                        "<li>Response #" + human_readable_ocnt + ": " 

                        +
                            ((q.entry[0].resource.group.question[ind].option[ind_o]) ?
                            q.entry[0].resource.group.question[ind].option[ind_o].display+ "" 
                            : 
                            "option Not known, ")
                        
                        +

                        "</li>"
  
                    ]     

                    $(container).append(o_data);
                }

                var o_data_end = "</ul>"
                $(container).append(o_data_start);

                
                $(container).append("");

                var final_answer = qr.resource.group.question[ind].answer[0].valueInteger;
                

                var adata = 
                [
                    ""

                    +

                    
                    
                    "</br> <b> User Selected Response: "

                    + 

                    ((q.entry[0].resource.group.question[ind].option[final_answer]) ?
                            q.entry[0].resource.group.question[ind].option[final_answer].display+ "" 
                            : 
                            "option Not known, ")    

                    +
                    "</b></br></br><hr>"
                   
                ]

                $(container).append(adata);
                
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
