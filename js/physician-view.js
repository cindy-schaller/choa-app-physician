/*global
Chart, GC, PointSet, Raphael, console, $,
jQuery, debugLog,
XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $) 
{

    "use strict";

    var selectedIndex = -1,
        PATIENT,

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
      
        $(container).append("<b>Hardcoded patient ID:</b> " + patientId + "</br></br>");
    
        mergeHTML0(100, 200, patientId,  container);
    }

    //requires weight in kg and heigh in cm
    function calculateBMI(weight, height)
    {
        var heightInM = height/100; 
        var BMI = weight/(heightInM*heightInM);
        return BMI;
    }

    function businessLogic(percentile){ 

        var OBESE_THRESHOLD = 0.95; 
        var OVERWEIGHT_THRESHOLD = 0.85; 
        var NORMAL_THRESHOLD = 0.05;

        if (percentile > OBESE_THRESHOLD)
            return "Obese";
        else if (percentile > RISK_THRESHOLD)
            return "Overweight";
        else if (percentile > NORMAL_THRESHOLD)
            return "Normal";
        else
            return "Underweight";
    }

    function getLastEnryHaving(propName) {
        if ( !PATIENT ) {
            return null;
        }
        return PATIENT.getLastEnryHaving(propName);
    }

    function getVitals() {
            var out = {
                    height : { value : undefined, "percentile" : null, color : "#0061A1", agemos : null },
                    weight : { value : undefined, "percentile" : null, color : "#F09C17", agemos : null },
                    headc  : { value : undefined, "percentile" : null, color : "#428500", agemos : null },
                    bmi    : { value : undefined, "percentile" : null, color : "#B26666", agemos : null },
                    
                    age : PATIENT.getCurrentAge()
                },
                src    = out.age.getYears() > 2 ? "CDC" : "WHO",
                gender = PATIENT.gender;
            
            $.each({
                height : { modelProp: "lengthAndStature", dsType : "LENGTH" },
                weight : { modelProp: "weight"          , dsType : "WEIGHT" },
                headc  : { modelProp: "headc"           , dsType : "HEADC"  },
                bmi    : { modelProp: "bmi"             , dsType : "BMI"    }
            }, function(key, meta) {
                var lastEntry = getLastEnryHaving( meta.modelProp ), ds, pct;
                if (lastEntry) {
                    ds = GC.getDataSet(src, meta.dsType, gender, 0, lastEntry.agemos);
                    out[key].value  = lastEntry[meta.modelProp];
                    out[key].agemos = lastEntry.agemos;
                    out[key].date   = new XDate(PATIENT.DOB.getTime()).addMonths(lastEntry.agemos);
                    
                    if (ds) {
                        pct = GC.findPercentileFromX(
                            out[key].value, 
                            ds, 
                            gender, 
                            lastEntry.agemos
                        );
                        if ( !isNaN(pct) ) {
                            out[key].percentile  = pct;
                        }
                    }
                }
            });
            
            return out;
    }
    
    function mergeHTML0(height, weight, patientId,  container) 
    {

        $.ajax({
            url: 'http://52.72.172.54:8080/fhir/baseDstu2/Patient?_id=' + patientId ,
            dataType: 'json',
            success: function(patientResult) { mergeHTML1(height, weight,patientResult,container )}
        });
    }


    function mergeHTML1(height, weight, patientResult, container) 
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

        PATIENT = GC.App.getPatient();
        
        //TO DO INSERT BMI AND OBESIT CALCULATION HERE
        var bob = getVitals(); 

        var weightActual = bob.weight.value;
        var heightActual = bob.height.value; 
        var BMI = calculateBMI(weightActual,heightActual);
        var perc = bob.weight.percentile; 
        var status = businessLogic(perc);       

    

        // $(container).append("<div class='row col-md-4'>" +
        //         "<table>" +
        //             "<tr><td><b>Patient name: </b></td><td>" + patientnameG +  " " + patientnameF + "</td></tr>" +
        //             "<tr><td><b>Gender: </b></td><td> " + patientgender + "</td></tr>" +
        //             "<tr><td><b>Birth date: </b></td><td>" + patientbirthdate + "</td></tr>" +
        //             "<tr><td><b>Weight: </b></td><td>" + weightActual + "</td></tr>" +
        //             "<tr><td><b>Height: </b></td><td> " + heightActual + "</td></tr>" +
        //             "<tr><td><b>BMI: </b></td><td>" + BMI + "</td></tr>" +
        //             "<tr><td><b>Percentile: </b></td><td>" + perc  +"</td></tr>" +
        //             "<tr><td><b>Obesity Status: </b></td><td>" + status  +"</td></tr>" +
        //         "</table>" +
        //     "</div>");

        $(container).append(
            "<div class='row col-md-4 media-middle'>" +
                "<dl class='dl-horizontal'>" +
                    "<dt> Patient name: </dt><dd>"  + patientnameG +  " "  + patientnameF + "</dt>" +
                    "<dt> Gender: </dt><dd>"  + patientgender + "</dt>" +
                    "<dt> Birthday: </dt><dd>"  + patientbirthdate + "</dt>" +
                    "<dt> Weight: </dt><dd>"  + weightActual + "</dt>" +
                    "<dt> Height: </dt><dd>"  + heightActual + "</dt>" +
                    "<dt> BMI: </dt><dd>"  + BMI + "</dt>" +
                    "<dt> Percentile: </dt><dd>"  + perc + "</dt>" +
                    "<dt> Obesity Status: </dt><dd>"  + status + "</dt>" +
                "</dl>" +
            "</div>");


        $.ajax
        ({

            url: 'http://52.72.172.54:8080/fhir/baseDstu2/QuestionnaireResponse?patient=' 
            + patientId ,

            dataType: 'json',

            success: function(questionareResult) { mergeHTML2(questionareResult,  container);}
                    
        });

        
    }


    function mergeHTML2(questionareResult,  container) 
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
            
           
            var last = questionareResult.entry.length -1;
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



        if (!questionare) return;

        var qr = questionareResult;
        var q = questionare;

        console.log(qr);
        console.log(q);

        var date = qr.resource.meta.lastUpdated;




        var title = q.entry[0].resource.text.div + "<h1><b>date questionnaire administered</b> : " + date  + "</h1>"

        $(container).append(title);

        var str = "<hr>";

        $(container).append(str);

        $(container).append("<div></div>").addClass("row cold-md-8");

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

                        "<li>"

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
