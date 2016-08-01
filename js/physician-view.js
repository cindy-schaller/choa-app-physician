/*global
 Chart, GC, PointSet, Raphael, console, $,
 jQuery, debugLog,
 XDate, setTimeout, getDataSet*/

/*jslint undef: true, eqeq: true, nomen: true, plusplus: true, forin: true*/
(function(NS, $)
{

    "use strict";
    var fhir_url = window.sessionStorage.getItem('fhir_url_global')  + '/';
    var patientID = window.sessionStorage.getItem('patientid_global');

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

    /**
     * Returns the last record having the given property "propName".
     * Can also be called before the patient has been initialized, in which case
     * it returns null.
     * @param {String} propName The name of the property to serach for inside
     *                          the recods.
     */
    function getLastEnryHaving(propName) {
        if ( !PATIENT ) {
            return null;
        }
        return PATIENT.getLastEnryHaving(propName);
    }

    /**
     * Modified getVitals function from gc-parental-view
     * Collects and returns the latest measurements and returns them as an
     * useful object...
     */
    function getVitals(PATIENT) {
        var out = {
                height : { value : undefined, "percentile" : null},
                weight : { value : undefined, "percentile" : null},
                headc  : { value : undefined, "percentile" : null},
                bmi    : { value : undefined, "percentile" : null},

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

    function convertToPercent(decimal) {
        return Math.round(decimal * 100) + '%';
    }

    function create_hhh_panel(container, hhg_qr, qr) {

        //console.log(qr);
        var goalMap = {
            1: 'Making half of their plate fruits and veggies',
            2: 'Being active',
            3: 'Limiting screen time',
            4: 'Drinking more water & limiting sugary drinks'
        };

        var selectedGoal = "N/A";
        if(qr.entry){
            var selectedIndex = qr.entry[0].resource.group.question[5].answer[0].valueInteger;
            selectedGoal = goalMap[selectedIndex];
        }

        var barriersDiscussed = "N/A";
        var barriersTemp = hhg_qr.entry[0].resource.group.question[7].answer;
        if(barriersTemp) {
            barriersDiscussed = barriersTemp[0].valueString;
        }

        var otherNotes = "N/A";
        var otherNotesTemp = hhg_qr.entry[0].resource.group.question[8].answer;
        if(otherNotesTemp) {
            otherNotes = otherNotesTemp[0].valueString;
        }

        var hhh_panel = "";
        hhh_panel += ("<div id='physician-hhh-panel'>");
        hhh_panel += ("<h4>Patient wanted to discuss:</h4>");
        hhh_panel += ("<blockquote> <b>" + selectedGoal + "</b> </blockquote>");
        hhh_panel += ("<h4>Last discussion of barriers:</h4>");
        hhh_panel += ("<blockquote>" + barriersDiscussed + "</blockquote>");
        hhh_panel += ("<h4>Other notes:</h4>");
        hhh_panel += ("<blockquote>" + otherNotes + "</blockquote>");
        hhh_panel += ("</div>");

        $(container).append(hhh_panel);
    }

    function create_hhh_tbl(container, hhg_qr) {

        var goalMap = {
            1: 'Make half your plate fruits and veggies',
            2: 'Be active',
            3: 'Limit screen time',
            4: 'Drink more water & limit sugary drinks'
        };

        var hhh_tbl = "";

        hhh_tbl += ("<div id='physician-hhh-tbl'>");
        hhh_tbl += ("<table> <tr> <th>Healthy Habit Goal</th> <th>Start Date</th> <th>End Date</th> <th>Barriers Discussed</th> </tr>");

        if(hhg_qr.entry){

            var hhg_qr_len = hhg_qr.entry.length;

            var prevGoal = 0;
            var prevStartDate = "";
            var prevEndDate = "";

            //console.log("QR LENGTH " + hhg_qr_len);
            for (var i = 0; i < hhg_qr_len; i++) {

                var response = hhg_qr.entry[i].resource;

                //console.log(i + " " + hhg_qr.entry[i].resource.group.question[0].answer[0].valueInteger);
                var goalResp = response.group.question[0].answer[0].valueInteger;
                var goalSet = goalMap[goalResp];

                var authorDate = (response.authored ? response.authored.split("T")[0] : "N/A");

                //console.log(i + " " + hhg_qr.entry[i].resource.group.question[7].answer[0].valueString);
                var barriersDiscussed = response.group.question[7].answer[0].valueString;

                var endDate = "";
                if(i == 0){
                    endDate = "Current";
                    prevEndDate = endDate;
                    prevStartDate = authorDate;
                    prevGoal = goalResp;
                } else {
                    if (goalResp == prevGoal) {
                        endDate = prevEndDate;
                        prevEndDate = endDate;
                        prevStartDate = authorDate;
                    } else {
                        endDate = prevStartDate;
                        prevEndDate = endDate;
                        prevStartDate = authorDate;
                        prevGoal = goalResp;
                    }
                }

                hhh_tbl += ("<tr> <td>" + goalSet + "</td> <td>" + authorDate + "</td> <td>" + endDate + "</td> <td>" + barriersDiscussed + "</td> </tr>");
            }

        } else {
            hhh_tbl += ("<tr> <td>No Healthy Habit Goal Set</td> <td>N/A</td> <td>N/A</td> </tr>");
        }

        hhh_tbl += ("</table>");
        hhh_tbl += ("</div>")

        $(container).append(hhh_tbl);
    }

    function renderPhysicianView(container) {
        $(container).empty();
        var topContainer = $("<div></div>").addClass("row");
        topContainer.attr("id", "thePatient-div");
        $(container).append(topContainer);
        var thePatient = $("<div></div>").addClass("col-xs-6 col-xs-offset-1").attr("id", "thePatientInfo-div");
        topContainer.append(thePatient);
        var patientInfo = $("<div></div>").addClass("col-xs-4");
        patientInfo.attr("id", "patientInfo-div");

        var InfantQuestionsID = window.sessionStorage.getItem('infant_questions_id');
        var AdolescentQuestionsID = window.sessionStorage.getItem('adolescent_questions_id');
        var questionsID = InfantQuestionsID;

        var patientCall = (function () {
            var patientCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Patient?_id=' + patientID,
                dataType: 'json',
                success: function (data) {
                    patientCall = data;
                }
            });
            return patientCall;
        })();

        var questionnaireResponseCall = (function () {
            var questionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + questionsID + "&_sort:desc=authored",
                dataType: 'json',
                success: function (data) {
                    questionnaireResponseCall = data;
                }
            });
            return questionnaireResponseCall;
        })();

        var wicQuestionnaireResponseCall = (function () {
            var wicQuestionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'/QuestionnaireResponse/1081290',
                dataType: 'json',
                success: function (data) {
                    wicQuestionnaireResponseCall = data;
                }
            });
            return wicQuestionnaireResponseCall;
        })();

        var questionnaireCall = (function () {
            var questionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Questionnaire?_id=' + questionsID,
                dataType: 'json',
                success: function (data) {
                    questionnaireCall = data;
                }
            });
            return questionnaireCall;
        })();

        var wicQuestionnaireCall = (function () {
            var wicQuestionnaireCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'Questionnaire/1081184',
                dataType: 'json',
                success: function (data) {
                    wicQuestionnaireCall = data;
                }
            });
            return wicQuestionnaireCall;
        })();

        var theQuestionnaires = $("<div></div>").addClass("row");
        theQuestionnaires.attr("id", "theQuestionnaires-div");
        $(container).append(theQuestionnaires);

        var hhgQuestionsID = window.sessionStorage.getItem('hhg_questions_id');

        var hhgQuestionnaireResponseCall = (function () {
            var hhgQuestionnaireResponseCall = null;
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'QuestionnaireResponse?patient=' + patientID + "&questionnaire=" + hhgQuestionsID + "&_sort:desc=authored",
                dataType: 'json',
                success: function (data) {
                    hhgQuestionnaireResponseCall = data;
                }
            });
            return hhgQuestionnaireResponseCall;
        })();

        var patientBMICall = (function () {
            var patientBMICall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 39156-5 for BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Observation?subject:Patient=' + patientID + '&code=39156-5&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientBMICall = data;
                }
            });
            return patientBMICall;
        })();

        var patientWeightCall = (function () {
            var patientWeightCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 3141-9 for Weight Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url +'Observation?subject:Patient=' + patientID + '&code=3141-9&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientWeightCall = data;
                }
            });
            return patientWeightCall;
        })();

        var patientHeightCall = (function () {
            var patientHeightCall = null;
            //refer to http://docs.smarthealthit.org/tutorials/server-quick-start/

            //Note LOINC Codes: 8302-2 for Height BMI Observations
            $.ajax({
                async: false,
                global: false,
                url: fhir_url + 'Observation?subject:Patient=' + patientID + '&code=8302-2&_count=50',
                dataType: 'json',
                success: function (data) {
                    patientHeightCall = data;
                }
            });
            return patientHeightCall;
        })();

        $.when(patientCall, questionnaireResponseCall, wicQuestionnaireResponseCall ,questionnaireCall, hhgQuestionnaireResponseCall, patientBMICall, patientWeightCall, patientHeightCall).then(function() {

            if (patientCall.entry) {
                var patient = patientCall.entry[0].resource;
            }

            var patientId = (patient.id ? patient.id : "");
            var patientVersion = (patient.meta.versionId) ? patient.meta.versionId : "";
            var patientLastUpdated = patient.meta.lastUpdated ? patient.meta.lastUpdated : "";
            var patientName = patient.name[0] ? patient.name[0].given[0] + " " + patient.name[0].family[0] : "";
            var patientGender = patient.gender ? patient.gender : "";
            var patientBDay = patient.birthDate ? patient.birthDate : "";
            var address = (patient.address ?
            (patient.address[0].line ?
            patient.address[0].line + "</br>" : "") +
            (patient.address[0].city ?
            patient.address[0].city + ", " : "") +
            (patient.address[0].state ?
            patient.address[0].state + " " : "") +
            (patient.address[0].postalCode ?
            patient.address[0].postalCode + "" : "") : "");
            var contact = (patient.telecom ?
            (patient.telecom[0].system ?
            patient.telecom[0].system + " " : "") +
            (patient.telecom[0].value ?
                patient.telecom[0].value : "") : "");

            // stamp = 0 = Unix Epoch. Fingers crossed that we don't deal with
            // "children" that are older than the age of 46 in this app.
            var latestRecording = { 'stamp': 0, 'text': '',
                'weight': -1, 'weightUnit': 'kg', 'weightStamp': 0,
                'height': -1, 'heightUnit': 'cm', 'heightStamp': 0,
                'bmi': -1, 'bmiUnit': 'kg/m2', 'bmiStamp': 0,
                'hemo': -1,  'hemoUnit': 'mg/dL', 'hemoStamp': 0 };
            // If not, hell breaks loose

            var process = function(d, l) {
                for (var i = d.length - 1; i >= 0; i--) {
                    if (d[i] != undefined &&
                        d[i].resource.effectiveDateTime != undefined) {
                        var t = Date.parse(d[i].resource.effectiveDateTime);

                        if (t > latestRecording[l + 'Stamp']) {
                            latestRecording[l + 'Stamp'] = t
                            latestRecording[l] = d[i].resource.valueQuantity.value;
                            latestRecording[l + 'Unit'] = d[i].resource.valueQuantity.unit;
                        }
                    }
                }
            }

            // FIXME: Optimize this into one FHIR query instead of 3 (or.actually,
            // when the app loads there are *6* observation requests...)
            process(patientWeightCall.entry, 'weight');
            process(patientHeightCall.entry, 'height');
            process(patientBMICall.entry, 'bmi');
            // FIXME: Implement hemoglobin A fetching
            // process(patientHeightCall.entry, 'hemo');

            localStorage.setItem("BMI", latestRecording.bmi);

            var bmiText, bmiClass;

            // FIXME: The comparisons can be optimized by inversing the evaluation order
            switch (true) {
                case (latestRecording.bmi <= 18.5):
                    bmiText = 'Underweight </br> BMI: ' + latestRecording.bmi;
                    bmiClass = 'text-warning'
                    break;
                case (18.5 < latestRecording.bmi && latestRecording.bmi <= 25):
                    bmiText = 'Normal weight </br> BMI: ' + latestRecording.bmi;
                    bmiClass = 'text-info'
                    break;
                case (25 < latestRecording.bmi && latestRecording.bmi <= 30):
                    bmiText = 'Overweight </br> BMI: ' + latestRecording.bmi;
                    bmiClass = 'text-warning'
                    break;
                case (30 < latestRecording.bmi && latestRecording.bmi <= 35):
                    bmiText = 'Class II obesity </br> BMI: ' + latestRecording.bmi;
                    bmiClass = 'text-warning'
                    break;
                case (35 < latestRecording.bmi && latestRecording.bmi <= 40):
                    bmiText = 'Class II obesity </br> BMI: ' + latestRecording.bmi;
                    bmiClass = 'text-danger'
                    break;
                case (40 < latestRecording.bmi):
                    bmiText = 'Class III obesity </br> BMI: ' + latestRecording.bmi;
                    bmiClass = 'text-danger'
                    break;
                default:
                // This should never happen
                // BMIClassification = "BMI: ー"
            }

            var BMIClassification = $("<div></div>")
                .append($("<strong></strong>")
                    .addClass(bmiClass)
                    .html(bmiText));

            thePatient.append($("<blockquote></blockquote>")
                .append($("<div></div>")
                    .addClass("patient-info")
                    .append($("<div></div>")
                        .addClass("patient-fullname")
                        .attr("id", "patient-fullname")
                        .append($("<strong></strong>")
                            .html(patientName)
                        )
                    )
                    .append($("<div></div>")
                        .addClass("patient-contact")
                        .attr("id", "patient-contact")
                        .append($("<abbr></abbr>")
                            .attr("title", "Contact")
                            .html(contact)))
                    .append($("<div></div>")
                        .addClass("patient-address")
                        .attr("id", "patient-address")
                        .append($("<address></address>")
                            .html(address)
                        )
                    )
					.append($("<div></div>")
                        .attr("id", "patient-BMI")
                        .append(BMIClassification)
					)
                    .append($("<small></small>")
                        .append($("<div></div>")
                            .addClass("patient-gender text-capitalize")
                            .attr("id", "patient-gender")
                            .html("<strong>Patient ID: </strong>" + patientId)
                        )
                    )
                )
            );

            patientInfo.append($("<div></div>")
                .addClass("patient-info")
                .append($("<blockquote></blockquote>")
                    .addClass("blockquote-reverse")
                    .append($("<div></div>")
                        .addClass("patient-gender text-capitalize")
                        .attr("id", "patient-gender")
                        .html("<strong>Gender: </strong>" + patientGender)
                    )
                    .append($("<div></div>")
                        .addClass("patient-bday dt")
                        .attr("id", "patient-bday")
                        .html("<strong>Birthdate: </strong>" + patientBDay)
                    )
                    .append($("<div></div>")
                        .attr("id", "patient-BMI")
                        .append(BMIClassification))
                    .append($("<div></div>")
                        .addClass("patient-weight")
                        .attr("id", "patient-weight")
                        .html("<strong>Weight: </strong>" + latestRecording.weight + " " + latestRecording.weightUnit)
                    )
                    .append($("<div></div>")
                        .addClass("patient-height")
                        .attr("id", "patient-height")
                        .html("<strong>Height: </strong>" + latestRecording.height + " " + latestRecording.heightUnit)
                    )
                 )
              );

            topContainer.append(patientInfo);

            var graph_str   ='                                                                                     '
                +'        <style>  '
                +'        .row-eq-height { display: -webkit-box; display: -webkit-flex; display: -ms-flexbox; display:         flex;}'
                +'        .carousel-control.left, .carousel-control.right { background-image: none}         '
                +'        </style>                                                                                                   '
                +'        <h2  align="center">Health Habit Item: Progress History</h2>                                           '
                +'        <div class="container" id="historyGraphDiscuss">                                                       '
                +'            <div class="row">                                                                                  '
                +'                 <div class="col-sm-8" id="GraphCarousel_div">     '
                +'                       <div id="myGraphCarousel" class="carousel slide" data-ride="carousel">       '
                +'                          <ol id="GraphCarouselIndicators"  class="carousel-indicators"> </ol>'
                +'                          <div id="carousel_inner_id" class="carousel-inner" role="listbox"> </div> '
                +'                           <!-- Left and right controls -->'
                +'                           <a class="left carousel-control" href="#myGraphCarousel" role="button" data-slide="prev">'
                +'                              <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>'
                +'                              <span class="sr-only">Previous</span>'
                +'                           </a>'
                +'                           <a class="right carousel-control" href="#myGraphCarousel" role="button" data-slide="next">'
                +'                              <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>'
                +'                              <span class="sr-only">Next</span>'
                +'                           </a>'
                +'                       </div>    '
                +'                  </div>    '
                +'                  <div class="col-sm-2" id="graph_key_div" style="border:1px solid black"></div>       '
                +'                  <div class="col-sm-2" id="wants_to_discuss_div"></div>                                   '
                +'            </div>    '
                +'        </div><p> </p>                                                                                             ';



            $(container).append(graph_str);

            var hhg_qr = hhgQuestionnaireResponseCall;
            var qr = questionnaireResponseCall;

            //console.log("HHG");
            //console.log(hhg_qr);

            create_hhh_tbl(container, hhg_qr);
            create_hhh_panel(container, hhg_qr, qr);

            /*****************************  graphs **************************/



            function create_graph( Question, key_word, answer_date , multiple_choices, canvasCount)
            {
                var legend_id= "legend_id_" + canvasCount;
                var margin = 30;
                var left_margin = 180; //size should be calculated the longest string in all the multiple_choices
                var right_margin = 30; //size should be calculated to be as long as a date of the authored feild


                var canvas_Carousel_id= "canvas_Carousel" + key_word;
                var canvas_str = '<canvas id="' + canvas_Carousel_id + '" height="400" width="750" style="border:1px solid #000000;" ></canvas>';

                //insert canvas into bootstrap carousel
                if(canvasCount == 0)// todo change to id of current goal
                {
                    var ol_str = '<li data-target="#myGraphCarousel" data-slide-to="'+canvasCount+ '" class="active"></li>';

                    var item_str ='<div class="item active">'+ canvas_str +'</div>';

                }
                else
                {
                    var ol_str = '<li data-target="#myGraphCarousel" data-slide-to="'+canvasCount+ '" ></li>';
                    var item_str ='<div class="item">'+ canvas_str +'</div>';
                }

                $('#GraphCarouselIndicators').append( ol_str);
                $('#carousel_inner_id').append( item_str);

                var canvas = document.getElementById(canvas_Carousel_id);

                var context = canvas.getContext("2d");



                context.font = "bold 13px Verdana"
                context.fillText(Question, margin , margin );

                context.font = "10px Verdana"

                //draw and label the row grid lines
                context.strokeStyle="#009933"; // color of grid lines



                var number_of_rows = multiple_choices.length;
                var yStep = (canvas.height - margin ) / number_of_rows;

                context.beginPath();
                for (var row_count = 0; row_count < number_of_rows; row_count++)
                {
                    var y =  (canvas.height - margin) - (row_count * yStep) ;
                    context.fillText(multiple_choices[row_count], margin, y );
                    context.moveTo(left_margin ,y);
                    context.lineTo(canvas.width,y);
                }
                context.stroke();


                // print dates on X axis every 3 months
                //1. convert newest and oldest dates into miliseconds
                var ms_in_3_months = (1000 * 60 * 60 * 24 * 30 *3);
                var oldestDate = answer_date[  answer_date.length -1   ].authored;
                var oldestTime = new Date(oldestDate);
                var newestDate = answer_date[0].authored;
                var newestTime = new Date(newestDate);
                var diff_max = newestTime.getTime() - oldestTime.getTime();  //ms of span from oldest date to newest date
                var diff_max_3_month_periods = diff_max / ms_in_3_months;
                var length_x_axis = canvas.width - left_margin - right_margin;
                var section_length = length_x_axis / diff_max_3_month_periods;

                for (var i = 0; i < diff_max_3_month_periods; i++)
                {

                    var d_time = oldestTime.getTime()  + (ms_in_3_months * i );
                    var d      = new Date(d_time);
                    var d_display = (d.getMonth() + 1 ) + "/" + d.getFullYear() ;
                    var x = left_margin + i * section_length;

                    context.fillText( d_display , x , (canvas.height -margin/2 ));
                }


                var x_y = [];

                // calculate the iregular interval on x axis
                //1. convert newest and oldest dates into miliseconds and figure out time span
                var oldestDate = answer_date[  answer_date.length -1   ].authored;
                var oldestTime = new Date(oldestDate);
                var newestDate = answer_date[0].authored;
                var newestTime = new Date(newestDate);
                var diff_max = newestTime.getTime() - oldestTime.getTime();  //ms of span from oldest date to newest date
                var length_x_axis = canvas.width - left_margin - right_margin;


                for (var i = 0; i < answer_date.length; i++)
                {
                    var currDate = answer_date[ i  ].authored;
                    var currTime = new Date(currDate);
                    var diff_to_curr = currTime.getTime() - oldestTime.getTime();
                    var frac_of_span = diff_to_curr /diff_max;
                    var X = (length_x_axis * frac_of_span) + left_margin;

                    var Y  = (canvas.height - margin) - ((answer_date[ i ].answer -1) * yStep) ;

                    x_y.push({ x:X , y:Y});

                    // draw the circles
                    context.fillStyle = "rgba(255, 255, 0, .5)";  //yellow
                    context.strokeStyle="#000000";
                    context.beginPath();
                    context.arc(X,Y,10,0,2*Math.PI);
                    context.closePath();
                    context.fill();
                    context.lineTo(X.Y ,y)
                    context.stroke();

                }

                //console.log("x_y")
                //console.log(x_y);

                //draw line on graph
                context.lineWidth=2;
                context.beginPath();
                context.moveTo(x_y[0].x,x_y[0].y)  ;
                for (var i = 1; i < answer_date.length; i++)
                {
                    context.lineTo(x_y[i].x,x_y[i].y);

                }
                context.stroke();

                //append the keyword to the graph key
                $( graph_key_div ).append( '<h3 id="'+ legend_id +'"  class="legend_class" ><font color="blue">'+ key_word +'</font></h3> <p> </p>'  );


            }



            //$( wants_to_discuss_div).html(  '<h3> Patient wants to discuss the following Healthy Habit: </h3> <h3> Barriers faced by patient: </h3>');
            $( graph_key_div ).append( '<h3> Click on Healthy Habit to see change over time: </h3>  <p> </p>'  );

            var answer_date = [];
            var multiple_choices = [];
            var Question = '';
            var Response = '';
            var Answer = '';
            var Authored = '';
            var questionnaire = '';
            var canvasCount =0;

            if (questionnaireCall.entry && questionnaireResponseCall.entry)
            {
                questionnaire = questionnaireCall.entry[0].resource;

                for(var q = 0; q < questionnaire.group.question.length; q++)
                    //for(var q = 0; q < 1; q++)
                {
                    Question = questionnaire.group.question[q].text
                    //console.log("Question")
                    //console.log(Question);

                    var graph_question = "";
                    var want_graph = false;

                    //only let through the questions about "veggies and fruits", "active", "fruit juice", "sweet drinks", "television"

                    var KeyWord = 'veggies and fruits';
                    var want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);

                    if(want_graph == false)
                    {
                        KeyWord = 'active';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                        //console.log("active")
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'fruit juice';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                        //console.log("fruit juice")
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'sweet drinks';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                        //console.log("fruit juice")
                    }

                    if(want_graph == false)
                    {
                        KeyWord = 'television';
                        want_graph = new RegExp('\\b' + KeyWord + '\\b').test(Question);
                        KeyWord = 'screen time';
                    }

                    if(want_graph == true )
                    {

                        multiple_choices = [];
                        for(var j = 0; j < questionnaire.group.question[q].option.length; j++)
                        {
                            multiple_choices.push(questionnaire.group.question[q].option[j].display);
                        }

                        answer_date = [];
                        for(var  qr = 0; qr < questionnaireResponseCall.entry.length; qr++)
                        {

                            Response   =   questionnaireResponseCall.entry[ qr ].resource;
                            Answer     =   Response.group.question[ q ].answer[ 0 ].valueInteger;
                            Authored   =   Response.authored.split("T")[ 0 ] ;
                            answer_date.push({ answer:Answer, authored:Authored});
                        }

                        //console.log("answer_date")
                        //console.log(answer_date);

                        create_graph(Question, KeyWord, answer_date, multiple_choices,canvasCount ) ;
                        canvasCount++;
                    }
                }
            }

            $('#myGraphCarousel').carousel('pause');

            $(".legend_class").click(function()
            {

                var this_id = this.id;
                var this_slider_number = this_id.replace(/^legend_id_/, '');
                $('#myGraphCarousel').carousel(Number(this_slider_number));
                $('#myGraphCarousel').carousel('pause');

            });


            /***************************** end  graphs **************************/

            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            var hhLastUpdated = new Date(questionnaireResponseCall.entry[0].resource.authored ? questionnaireResponseCall.entry[0].resource.authored : "-");
            var wicLastUpdated = new Date(wicQuestionnaireResponseCall.authored ? wicQuestionnaireResponseCall.authored: "-");

            if (!isNaN(hhLastUpdated)) {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "healthyHabits-div")
                    .addClass("col-xs-5 col-xs-offset-1 text-center")
                    .append($("<a></a>")
                        .attr("id", "view-HHQuestionnaireAndResponse")
                        .append($("<h3></h3>")
                            .html("Healthy Habits Assessment Response <br>")
                        )
                        .append($("<p></p>")
                            .html("Updated " + months[hhLastUpdated.getMonth()] + " " + hhLastUpdated.getDate() + ", " + hhLastUpdated.getFullYear())
                        )
                        .append($("<p></p>")
                            .html("click to see results")
                        )
                    )
                );
            } else {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "healthyHabits-div")
                    .addClass("col-xs-5 col-xs-offset-1 text-center")
                    .append($("<h3></h3>")
                        .html("Healthy Habits Assessment Response <br>")
                    )
                    .append($("<p></p>")
                        .html("The patient has not completed the Healthy Eating Survey")
                    )
                );
            }

            if (!isNaN((wicLastUpdated))) {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "wic-div")
                    .addClass("col-xs-offset-6 text-center")
                    .append($("<a></a>")
                        .attr("id", "view-WICQuestionnaireAndResponse")
                        .append($("<h3></h3>")
                            .html("WIC Questionnaire Response <br>")
                        )
                        .append($("<p></p>")
                            .html(" Updated " + months[wicLastUpdated.getMonth()] + " " + wicLastUpdated.getDate() + ", " + wicLastUpdated.getFullYear())
                        )
                        .append($("<p></p>")
                            .html("click to see results")
                        )
                    )
                );
            } else {
                theQuestionnaires.append($("<div></div>")
                    .attr("id", "wic-div")
                    .addClass("col-xs-offset-6 text-center")
                    .append($("<h3></h3>")
                        .html("WIC Questionnaire Response <br>")
                    )
                    .append($("<p></p>")
                        .html("The patient has not completed the WIC Questionnaire")
                    )
                );
            }

            $("#dialog").dialog({ autoOpen: false, height: 500, width: 1000, overflow: scroll });
            $("#view-HHQuestionnaireAndResponse").click(function() {

                $("#dialog").empty();

                var theSurvey = $("<div></div>").addClass("col-xs-10 col-xs-offset-1");
                theSurvey.attr("id", "theSurvey-div");
                $("#dialog").append(theSurvey);
                if (questionnaireCall.entry) {
                    var questionnaire = questionnaireCall.entry[0].resource;
                }
                if (questionnaireResponseCall.entry) {
                    var response = questionnaireResponseCall.entry[0].resource;
                }

                var questionnaireId = "";
                if (questionnaire) {
                    questionnaireId = (questionnaire.id ? questionnaire.id : "");
                }

                var questionnaireVersion = "";
                var questionnaireLastUpdated = "";

                if (questionnaire) {
                    if(questionnaire.meta){
                        questionnaireVersion = (questionnaire.meta.versionId ? questionnaire.meta.versionId : "");
                        questionnaireLastUpdated = (questionnaire.meta.lastUpdated ? questionnaire.meta.lastUpdated.split("T")[0] : "");
                    }
                }
                var responseLastUpdated = "";
                if(response)
                {
                    var responseAuthored = new Date(response.authored ? response.authored : "-");
                    if(response.meta){
                        responseLastUpdated = (response.meta.lastUpdated ? response.meta.lastUpdated.split("T") : "");
                    }
                    var qAndA = [];
                    for(var i = 0; i < questionnaire.group.question.length; i++) {
                        //search for validated by LinkId final answer
                        var question_link_ID = questionnaire.group.question[i].linkId;
                        var qr_index = -1;
                        for (var x = 0; x < response.group.question.length ; x++) {
                            if(question_link_ID == response.group.question[x].linkId){
                                qr_index = x;
                                break;
                            }
                        }
                        if(qr_index == -1){
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the questionnaire-response");
                            return;
                        }
                        var final_answer = response.group.question[qr_index].answer[0].valueInteger - 1;
                        qAndA.push({question:(questionnaire.group.question[qr_index].text), answerCode:final_answer});
                    }

                    theSurvey.append($("<div></div>")
                        .html("<hr>")
                        .append($("<h1></h1>")
                            .addClass("text-center text-muted btn-group-sm")
                            .html("Healthy habits questionnaire responses")
                        )
                    );

                    for(var i = 0; i < questionnaire.group.question.length; i++) {
                        var options = [];
                        for(var j = 0; j < questionnaire.group.question[i].option.length; j++) {
                            options.push(questionnaire.group.question[i].option[j].display);
                        }
                        var surveyRow = $("<div></div>")
                            .addClass("btn-group")
                            .attr("data-toggle", "buttons")
                            .attr("role", "group");
                        for (var j = 0; j < options.length; j++) {
                            if (qAndA[i].answerCode == j) {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive active disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                            else {
                                surveyRow.append($("<div></div>")
                                    .addClass("btn-group btn-group-sm")
                                    .attr("role", "group")
                                    .append($("<a></a>")
                                        .addClass("btn btn-default btn-responsive disabled")
                                        .attr("type", "button")
                                        .html(options[j])
                                    )
                                );
                            }
                        }
                        theSurvey.append($("<div></div>")
                            .addClass("row well")
                            .append($("<div></div>")
                                .addClass("text-center text-muted")
                                .append($("<h4></h4>")
                                    .html(qAndA[i].question)
                                )
                            )
                            .append($("<div></div>")
                                .append(surveyRow)
                            )
                        );
                    }
                }
                else {
                    $("#dialog").append("<div id='physician-questionnaire-blank'>The patient has not completed the Healthy Eating Survey.</div>");
                }

                $("#dialog").dialog("open");
            });

            $("#dialog").dialog({ autoOpen: false, height: 600, width: 1200, overflow: scroll });
            $("#view-WICQuestionnaireAndResponse").click(function() {

                $("#dialog").empty();

                var wicSurvey = $("<div></div>").addClass("col-xs-12");
                wicSurvey.attr("id", "wicSurvey-div");
                $("#dialog").append(wicSurvey);

                if (questionnaireResponseCall.entry) {
                    var response = questionnaireResponseCall.entry[0].resource;
                }

                if (wicQuestionnaireCall.group && wicQuestionnaireResponseCall.group) {

                    var wicQuestionnaire = wicQuestionnaireCall.group.group;
                    var linkId;
                    var questionGroups = [];
                    var subQuestionLinkId;
                    var subQuestionGroupID;
                    var wicQRLinkID;
                    var wicSubQRLinkID;
                    var wicQAndA = [];

                    var wicQuestionnaireResponse = wicQuestionnaireResponseCall.group.group;

                    var wicQRIndex = -1;
                    for (var i = 0; i < wicQuestionnaire.length; i++) {
                        linkId = wicQuestionnaire[i].linkId
                        for (var j = 0; j < wicQuestionnaireResponse.length; j++) {
                            wicQRLinkID = wicQuestionnaireResponse[j].linkId;
                            if (linkId == wicQRLinkID) {
                                wicQRIndex = j;
                                break;
                            }
                        }
                        if (wicQRIndex == -1) {
                            console.log("ERROR: could not validate linkId of question to any existing LinkID in the wic-questionnaire-response");
                            return;
                        }

                        questionGroups.push({groupID:wicQuestionnaire[wicQRIndex].linkId, Topic:wicQuestionnaire[wicQRIndex].text});

                        var wicSubQRIndex = -1;
                        for (var j = 0; j < wicQuestionnaire[wicQRIndex].question.length; j++) {
                            subQuestionLinkId = wicQuestionnaire[wicQRIndex].question[j].linkId;
                            for (var k = 0; k < wicQuestionnaireResponse[wicQRIndex].question.length; k++) {
                                wicSubQRLinkID = wicQuestionnaire[wicQRIndex].question[k].linkId;
                                if (subQuestionLinkId == wicSubQRLinkID) {
                                    wicSubQRIndex = k;
                                    break;
                                }
                            }
                            if (wicSubQRIndex == -1) {
                                console.log("ERROR: could not validate linkId of sub-question to any existing LinkID in the wic-questionnaire-response");
                                return;
                            }

                            //region wicQandA
                            var codes = [];
                            var options = [];
                            var answer;
                            var id = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].linkId;
                            var groupID = wicQuestionnaire[wicQRIndex].linkId;
                            var questionType = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].type;
                            subQuestionLinkId = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].linkId;
                            subQuestionGroupID = wicQuestionnaireResponse[wicQRIndex].linkId;
                            var questionAsked = wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].text;
                            var questionResponseType = wicQuestionnaireResponse[wicQRIndex].question[wicSubQRIndex].answer[0];

                            if (questionType == "boolean" && questionResponseType.valueBoolean !== undefined && id == subQuestionLinkId) {
                                for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                    codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                    options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                }
                                answer = questionResponseType.valueBoolean;
                                wicQAndA.push({
                                    ID: id,
                                    groupID: groupID,
                                    question: questionAsked,
                                    answer: answer,
                                    responseChoices: options,
                                    responseChoiceCodes: codes,
                                    responseType: questionType
                                });
                            }
                            if (questionType == "text" && questionResponseType.valueString !== undefined && id == subQuestionLinkId) {
                                answer = questionResponseType.valueString;
                                wicQAndA.push({
                                    ID: id,
                                    groupID: groupID,
                                    question: questionAsked,
                                    answer: answer,
                                    responseChoices: "",
                                    responseChoiceCodes: "",
                                    responseType: questionType
                                });
                            }
                            if (questionType == "integer" && questionResponseType.valueInteger !== undefined && id == subQuestionLinkId ) {
                                for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                    for (var l = 0; l < wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option.length; l++) {
                                        codes.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].code);
                                        options.push(wicQuestionnaire[wicQRIndex].question[wicSubQRIndex].option[l].display);
                                    }
                                    answer = questionResponseType.valueInteger;
                                    wicQAndA.push({
                                        ID: id,
                                        groupID: groupID,
                                        question: questionAsked,
                                        answer: answer,
                                        responseChoices: options,
                                        responseChoiceCodes: codes,
                                        responseType: questionType
                                    });
                                }
                            }
                            //endregion
                        }
                    }

                    //FIX ME: This was done just to get things to show and there is a lot of repetitive code

                    wicSurvey.append($("<div></div>")
                        .html("<hr>")
                        .attr("id", "wic-questionnaire-title-div")
                        .append($("<h1></h1>")
                            .addClass("text-center text-muted btn-group-sm")
                            .html("WIC Questionnaire Response")
                        )
                    );
                    var leftDiv = $("<div></div>")
                        .addClass("col-xs-5 form-group")
                        .attr("id", "leftDiv");

                    var rightDiv = $("<div></div>")
                        .addClass("col-xs-offset-7 form group")
                        .attr("id", "rightDiv");

                    var linkID1Form = $("<form></form>")
                        .addClass("row col-xs-12 form-horizontal")
                        .attr("role", "form");

                    var linkID2Form = $("<form></form>")
                        .addClass("row form horizontal")
                        .attr("role", "form");

                    var linkID2SelectorDiv = $("<div></div>")
                        .addClass("form-group col-xs-6");

                    var linkID2Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px");

                    var linkID3Form = $("<form></form>");

                    var linkID4Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID5Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID6Form = $("<form></form>")
                        .addClass("form horizontal")
                        .attr("role", "form");

                    var linkID6SelectorDiv = $("<div></div>")
                        .addClass("form-group col-xs-6");

                    var linkID6Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px");

                    var linkID7Form = $("<form></form>")
                        .addClass("form horizontal")
                        .attr("role", "form");

                    var linkID7SelectorDiv = $("<div></div>")
                        .addClass("form-group");

                    var linkID7Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px")
                        .css("width", "100%");

                    var linkID8Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID9Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID10Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID11Form = $("<form></form>")
                        .addClass("form horizontal")
                        .attr("role", "form");

                    var linkID11SelectorDiv = $("<div></div>")
                        .addClass("form-group");

                    var linkID11Selector =$("<select></select>")
                        .addClass("form-control")
                        .attr("multiple", "")
                        .css("height", "185px")
                        .css("width", "80%");

                    var linkID12Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID13Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID14Form = $("<div></div>")
                        .addClass("form-group");

                    var linkID15Form = $("<form></form>")
                        .addClass("row col-xs-12 form-horizontal")
                        .attr("role", "form");

                    var linkID16Form = $("<div></div>")
                        .addClass("form-group");

                    for (var i = 0; i < questionGroups.length; i++) {
                        for (var j = 0; j < wicQAndA.length; j++) {

                            //region LinkID1
                            if (questionGroups[i].groupID == 1 && wicQAndA[j].groupID == 1) {
                                if (wicQAndA[j].responseType == "boolean") {
                                    var questionID = parseFloat(wicQAndA[j].ID).toFixed(1);

                                    var linkID1Title = $("<div></div>")
                                        .attr("id", "linkID1-title-div")
                                        .append($("<h4></h4>")
                                            .html(questionGroups[i].Topic)
                                        );
                                    var _linkID1 = $("<div></div>")
                                        .addClass("checkbox")
                                        .append($("<input>")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .attr("type", "checkbox")
                                            .attr("disabled", true)
                                            .prop("checked", wicQAndA[j].answer)
                                            .css("padding", "1px")
                                            .css("width", "60px")
                                            .css("height", "30px")
                                        )
                                        .append($("<p></p>")
                                            .css("padding", "5px 3px 0px 55px")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .html(wicQAndA[j].question)
                                        );
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var answerID =  wicQAndA[j].ID;
                                    var _linkID1a = $("<textarea></textarea>")
                                        .addClass("form-control")
                                        .attr("disabled", true)
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("margin-left", "30px")
                                        .css("height", "20px");
                                }
                                var adjustedQuestionID = (Number(questionID)+0.1).toFixed(parseInt(1));

                                if (Number(answerID) == adjustedQuestionID) {
                                    _linkID1.append(_linkID1a);
                                }
                            }
                            linkID1Form.append(_linkID1);
                            //endregion

                            //region LinkID2

                            if (questionGroups[i].groupID == 2 && wicQAndA[j].groupID == 2) {

                                var linkID2Title = $("<div></div>")
                                    .attr("id", "linkID2-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                if (wicQAndA[j].responseType == "boolean") {
                                    for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                        var _linkID2 = $("<option></option>")
                                            .addClass("form-control")
                                            .attr("multiple", "")
                                            .prop("selected", wicQAndA[j].answer)
                                            .attr("disabled", "disabled")
                                            .css("border", "0px")
                                            .css("outline", "0px")
                                            .css("width", "80%")
                                            .html(wicQAndA[j].question);
                                    }
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var _linkID2Text = $("<div></div>")
                                        .addClass("form-group col-xs-offset-7")
                                        .append($("<label></label>")
                                            .attr("for", "other")
                                            .html(wicQAndA[j].question)
                                            .append($("<textarea></textarea>")
                                                .addClass("form-control")
                                                .attr("rows", "7")
                                                .attr("id", "other")
                                                .attr("placeholder", wicQAndA[j].answer)
                                                .attr("disabled", true)
                                            )
                                        );
                                }
                            }
                            linkID2Selector.append(_linkID2);
                            linkID2SelectorDiv.append(linkID2Selector);
                            linkID2Form.append(linkID2SelectorDiv);
                            linkID2Form.append(_linkID2Text);
                            //endregion

                            //region LinkID3

                            if(questionGroups[i].groupID == 3 && wicQAndA[j].groupID == 3) {
                                var linkID3Title = $("<div></div>")
                                    .attr("id", "linkID3-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID3 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID3Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio" + wicQAndA[j].ID +"selected")
                                            .html(wicQAndA[j].responseChoices[0])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                                .prop("checked", true)
                                            )
                                        )
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio"+wicQAndA[j].ID+"notselected")
                                            .html(wicQAndA[j].responseChoices[1])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                            )
                                        );
                                } else {
                                    linkID3Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "notselected-choice")
                                            .attr("for", "linkID3Radio" + wicQAndA[j].ID +"notselected")
                                            .html(wicQAndA[j].responseChoices[0])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"notselected")
                                            )
                                        )
                                        .append($("<label></label>")
                                            .addClass("form-check-inline")
                                            .attr("id", "selected-choice")
                                            .attr("for", "linkID3Radio"+wicQAndA[j].ID+"selected")
                                            .html(wicQAndA[j].responseChoices[1])
                                            .append($("<input>")
                                                .addClass("form-check-input")
                                                .attr("type","radio")
                                                .attr("disabled", true)
                                                .attr("name", "inlineRadioOptions")
                                                .attr("id", "linkID3Radio" + wicQAndA[j].ID+"selected")
                                                .prop("checked", true) //FIX ME
                                            )
                                        );
                                }
                                _linkID3.append(linkID3Radio);
                            }
                            linkID3Form.append(_linkID3);
                            //endregion

                            //region LinkID4
                            if (questionGroups[i].groupID == 4 && wicQAndA[j].groupID == 4) {
                                var linkID4Title = $("<div></div>")
                                    .attr("id", "linkID4-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID4 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID4Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID4Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID4Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID4Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID4.append(linkID4Radio);
                            }
                            linkID4Form.append(_linkID4);
                            //endregion

                            //region LinkID5
                            if (questionGroups[i].groupID == 5 && wicQAndA[j].groupID == 5) {
                                var linkID5Title = $("<div></div>")
                                    .attr("id", "linkID5-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID5 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");


                                if (wicQAndA[j].answer == 1) {
                                    var linkID5Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 2){
                                    linkID5Radio =  $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 3) {
                                    linkID5Radio =  $("<div></div>")
                                        .attr("id", "third-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID5Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID5Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID5.append(linkID5Radio);
                            }
                            linkID5Form.append(_linkID5);
                            //endregion

                            //region LinkID6
                            if (questionGroups[i].groupID == 6 && wicQAndA[j].groupID == 6) {

                                var linkID6Title = $("<div></div>")
                                    .attr("id", "linkID6-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                if (wicQAndA[j].responseType == "boolean") {
                                    for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                        var _linkID6 = $("<option></option>")
                                            .addClass("form-control")
                                            .attr("multiple", "")
                                            .prop("selected", wicQAndA[j].answer)
                                            .attr("disabled", "disabled")
                                            .css("border", "0px")
                                            .css("outline", "0px")
                                            .css("width", "80%")
                                            .html(wicQAndA[j].question);
                                    }
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var _linkID6Text = $("<div></div>")
                                        .addClass("form-group col-xs-offset-7")
                                        .append($("<label></label>")
                                            .attr("for", "other")
                                            .html(wicQAndA[j].question)
                                            .append($("<textarea></textarea>")
                                                .addClass("form-control")
                                                .attr("rows", "7")
                                                .attr("id", "other")
                                                .attr("placeholder", wicQAndA[j].answer)
                                                .attr("disabled", true)
                                            )
                                        );
                                }
                            }
                            linkID6Selector.append(_linkID6);
                            linkID6SelectorDiv.append(linkID6Selector);
                            linkID6Form.append(linkID6SelectorDiv);
                            linkID6Form.append(_linkID6Text);
                            //endregion

                            //region LinkID7
                            if (questionGroups[i].groupID == 7 && wicQAndA[j].groupID == 7) {

                                var linkID7Title = $("<div></div>")
                                    .attr("id", "linkID7-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                    var _linkID7 = $("<option></option>")
                                        .addClass("form-control text-center")
                                        .attr("multiple", "")
                                        .prop("selected", wicQAndA[j].answer)
                                        .attr("disabled", "disabled")
                                        .css("border", "0px")
                                        .css("outline", "0px")
                                        .css("width", "80%")
                                        .html(wicQAndA[j].question);
                                }
                            }
                            linkID7Selector.append(_linkID7);
                            linkID7SelectorDiv.append(linkID7Selector);
                            linkID7Form.append(linkID7SelectorDiv);
                            //endregion

                            //region linkID8
                            if (questionGroups[i].groupID == 8 && wicQAndA[j].groupID == 8) {
                                var linkID8Title = $("<div></div>")
                                    .attr("id", "linkID8-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID8 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID8Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID8Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID8Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID8Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID8Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID8.append(linkID8Radio);
                            }
                            linkID8Form.append(_linkID8);
                            //endregion

                            //region linkID9
                            if (questionGroups[i].groupID == 9 && wicQAndA[j].groupID == 9) {
                                var linkID9Title = $("<div></div>")
                                    .attr("id", "linkID9-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID9 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID9Form.append(linkID9);
                            //endregion

                            //region linkID10
                            if (questionGroups[i].groupID == 10 && wicQAndA[j].groupID  == 10) {
                                var linkID10Title = $("<div></div>")
                                    .attr("id", "linkID10-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID10 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID10Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID10Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID10Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID10Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID4Radio" + wicQAndA[j].ID + "notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type", "radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID + "notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID10Radio" + wicQAndA[j].ID + "selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type", "radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID10Radio" + wicQAndA[j].ID + "selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID10.append(linkID10Radio);
                            }
                            linkID10Form.append(_linkID10);
                            //endregion

                            //region linkID11
                            if (questionGroups[i].groupID == 11 && wicQAndA[j].groupID == 11) {

                                var linkID11Title = $("<div></div>")
                                    .attr("id", "linkID11-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                for (var k = 0; k < wicQAndA[j].responseChoices.length; k++) {
                                    var _linkID11 = $("<option></option>")
                                        .addClass("form-control text-center")
                                        .attr("multiple", "")
                                        .prop("selected", wicQAndA[j].answer)
                                        .attr("disabled", "disabled")
                                        .css("border", "0px")
                                        .css("outline", "0px")
                                        .css("width", "80%")
                                        .html(wicQAndA[j].question);
                                }
                            }
                            linkID11Selector.append(_linkID11);
                            linkID11SelectorDiv.append(linkID11Selector);
                            linkID11Form.append(linkID11SelectorDiv);
                            //endregion

                            //region linkID12
                            if (questionGroups[i].groupID == 12 && wicQAndA[j].groupID == 12) {
                                var linkID12Title = $("<div></div>")
                                    .attr("id", "linkID12-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID12 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");


                                if (wicQAndA[j].answer == 1) {
                                    var linkID12Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline text-center")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID12Radio" + wicQAndA[j].ID +"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 2){
                                    linkID12Radio =  $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else if (wicQAndA[j].answer == 3) {
                                    linkID12Radio =  $("<div></div>")
                                        .attr("id", "third-choice-selected")
                                        .addClass("form-group")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio" + wicQAndA[j].ID +"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"notselected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID12Radio"+wicQAndA[j].ID+"selected")
                                                .css("width", "30%")
                                                .html(wicQAndA[j].responseChoices[2])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID12Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID12.append(linkID12Radio);
                            }
                            linkID12Form.append(_linkID12);
                            //endregion

                            //region linkID13
                            if (questionGroups[i].groupID == 13 && wicQAndA[j].groupID == 13) {
                                var linkID13Title = $("<div></div>")
                                    .attr("id", "linkID13-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID13 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID13Form.append(linkID13);
                            //endregion

                            //region linkID14
                            if (questionGroups[i].groupID == 14 && wicQAndA[j].groupID == 14) {
                                var linkID14Title = $("<div></div>")
                                    .attr("id", "linkID8-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var _linkID14 = $("<label></label>")
                                    .addClass("radio-in-line")
                                    .html(wicQAndA[j].question + "<br>");

                                if (wicQAndA[j].answer == true) {
                                    var linkID14Radio = $("<div></div>")
                                        .attr("id", "first-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID14Radio" + wicQAndA[j].ID +"selected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID14Radio"+wicQAndA[j].ID+"notselected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                        );
                                } else {
                                    linkID14Radio = $("<div></div>")
                                        .attr("id", "second-choice-selected")
                                        .append($("<form></form>")
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "notselected-choice")
                                                .attr("for", "linkID14Radio" + wicQAndA[j].ID +"notselected")
                                                .html(wicQAndA[j].responseChoices[0])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"notselected")
                                                )
                                            )
                                            .append($("<label></label>")
                                                .addClass("form-check-inline")
                                                .attr("id", "selected-choice")
                                                .attr("for", "linkID14Radio"+wicQAndA[j].ID+"selected")
                                                .html(wicQAndA[j].responseChoices[1])
                                                .append($("<input>")
                                                    .addClass("form-check-input")
                                                    .attr("type","radio")
                                                    .attr("disabled", true)
                                                    .attr("name", "inlineRadioOptions")
                                                    .attr("id", "linkID14Radio" + wicQAndA[j].ID+"selected")
                                                    .prop("checked", true)
                                                )
                                            )
                                        );
                                }
                                _linkID14.append(linkID14Radio);
                            }
                            linkID14Form.append(_linkID14);
                            //endregion

                            //region linkID15
                            if (questionGroups[i].groupID == 15 && wicQAndA[j].groupID == 15) {
                                if (wicQAndA[j].responseType == "boolean") {
                                    var linkID15QuestionID = parseFloat(wicQAndA[j].ID).toFixed(1);

                                    var linkID15Title = $("<div></div>")
                                        .attr("id", "linkID15-title-div")
                                        .append($("<h4></h4>")
                                            .html(questionGroups[i].Topic)
                                        );
                                    var _linkID15 = $("<div></div>")
                                        .addClass("checkbox")
                                        .append($("<input>")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .attr("type", "checkbox")
                                            .attr("disabled", true)
                                            .prop("checked", wicQAndA[j].answer)
                                            .css("padding", "1px")
                                            .css("width", "60px")
                                            .css("height", "30px")
                                        )
                                        .append($("<p></p>")
                                            .css("padding", "5px 3px 0px 55px")
                                            .attr("id", "linkID: " + wicQAndA[j].ID)
                                            .html(wicQAndA[j].question)
                                        );
                                }
                                if (wicQAndA[j].responseType == "text") {
                                    var linkID15AnswerID =  wicQAndA[j].ID;
                                    var _linkID15a = $("<textarea></textarea>")
                                        .addClass("form-control")
                                        .attr("disabled", true)
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("margin-left", "30px")
                                        .css("height", "20px");
                                }
                                var linkID15AdjustedQuestionID = (Number(questionID)+0.1).toFixed(parseInt(1));

                                if (Number(linkID15AnswerID) == linkID15AdjustedQuestionID) {
                                    _linkID15.append(_linkID15a);
                                }
                            }
                            linkID15Form.append(_linkID15);
                            //endregion

                            //region linkID16
                            if (questionGroups[i].groupID == 16 && wicQAndA[j].groupID == 16) {
                                var linkID16Title = $("<div></div>")
                                    .attr("id", "linkID16-title-div")
                                    .append($("<h4></h4>")
                                        .html(questionGroups[i].Topic)
                                    );

                                var linkID16 = $("<label></label>")
                                    .attr("for", "linkID"+wicQAndA[j].ID+"textfield")
                                    .css("width", "80%")
                                    .html(wicQAndA[j].question + "<br>")
                                    .append($("<input>")
                                        .addClass("form-control")
                                        .attr("type", "text")
                                        .attr("disabled", true)
                                        .attr("id", "linkID"+wicQAndA[j].ID+"textfield")
                                        .attr("placeholder", wicQAndA[j].answer)
                                        .css("width", "100%")
                                    )

                            }
                            linkID16Form.append(linkID16);
                            //endregion

                        }
                    }

                    leftDiv.append(linkID1Title)
                        .append(linkID1Form)
                        .append(linkID2Title)
                        .append(linkID2Form)
                        .append(linkID3Title)
                        .append(linkID3Form)
                        .append(linkID4Title)
                        .append(linkID4Form)
                        .append(linkID5Title)
                        .append(linkID5Form)
                        .append(linkID6Title)
                        .append(linkID6Form);

                    rightDiv.append(linkID7Title)
                        .append(linkID7Form)
                        .append(linkID8Title)
                        .append(linkID8Form)
                        .append(linkID9Title)
                        .append(linkID9Form)
                        .append(linkID10Title)
                        .append(linkID10Form)
                        .append(linkID11Title)
                        .append(linkID11Form)
                        .append(linkID12Title)
                        .append(linkID12Form)
                        .append(linkID13Title)
                        .append(linkID13Form)
                        .append(linkID14Title)
                        .append(linkID14Form)
                        .append(linkID15Title)
                        .append(linkID15Form)
                        .append(linkID16Title)
                        .append(linkID16Form);

                    wicSurvey.append(leftDiv);
                    wicSurvey.append(rightDiv);

                }
                else {
                    $("#dialog").append("<div id='physician-questionnaire-blank'>The patient has not completed the WIC questionnaire.</div>");
                }
                $("#dialog").dialog("open");
            });
        });
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