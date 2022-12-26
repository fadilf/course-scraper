let courseRows = null;

$.getJSON("../collated.json", function (data) {
    let table_content = "";
    let codes = {};
    courseList = Object.keys(data.Credits);
    courseList.forEach((course, index) => {
        let code = course.split(" ")[0];
        if (!(code in codes)) {
            codes[code] = 1;
            $("#subject-code").append(`<option value="${code}">${code}</option>`);
        }
        let title = data.Title[course];
        let courseURL = data.URL[course];
        let distribution = data["Distribution Group"][course];
        distribution = distribution ? distribution : "";
        let diversity = data["Analyzing Diversity"][course];
        diversity = diversity ? diversity : "";
        let credits = data.Credits[course];
        table_content +=
            `<tr class="visible valid-sem valid-query ${index % 2 ? "odds" : "evens"}" data-course="${course}" data-course-code="${code}" data-distribution="${distribution}" data-diversity="${diversity}">
                <th scope="row">
                    <a href="https://courses.rice.edu${courseURL}" target="_blank" class="text-decoration-none">
                        ${course}
                    </a>
                </th>
                <td>${title}</td>
                <td>${distribution}</td>
                <td>${diversity}</td>
                <td>${credits}</td>
            </tr>`;
    });
    $("#course-rows").append(table_content);

    let semesters = Object.keys(data).slice(5);
    semesters.forEach(semester => {
        $("#academic-semester").append(`
        <option value="${semester}">${semester}</option>
        `);
    });

    $("#academic-semester").on('change', function () {
        $("#course-rows tr.valid-sem").removeClass("valid-sem");
        if (this.value == "") {
            $("#course-rows tr").addClass("valid-sem");
        } else {
            for (const [course, valid] of Object.entries(data[this.value])) {
                if (valid) {
                    $(`#course-rows tr[data-course="${course}"]`).addClass("valid-sem");
                }
            }
        }
        updateVisible();
    });

    let queryTimeout = null;
    function executeQuery(queryClean) {
        $("#course-rows tr.valid-sem").removeClass("valid-query");
        for (const [course, title] of Object.entries(data.Title)) {
            if ([course, title].join(" ").indexOf(queryClean) != -1) {
                $(`#course-rows tr[data-course="${course}"]`).addClass("valid-query");
            }
        }
        updateVisible();
    }
    function queryPipeline(queryClean) {
        clearTimeout(queryTimeout);
        queryTimeout = setTimeout(executeQuery, 400, queryClean);
    }
    $("#query").on('input', function () {
        queryPipeline(this.value.trim().toUpperCase());
    });

    $('#subject-code').on('change', function () {
        updateVisible();
    });

    $('#distribution-group').on('change', function () {
        updateVisible();
    });

    $('#diversity').on('change', function () {
        updateVisible();
    });

});

function updateVisible(){
    let filters = "";
    let subjectCode = $('#subject-code').val();
    let distribution = $('#distribution-group').val();
    let diversity = $("#diversity").prop("checked");

    if (subjectCode != "") {
        filters += `[data-course-code="${subjectCode}"]`;
    }
    if (distribution != "") {
        filters += `[data-distribution="${distribution}"]`;
    }
    if (diversity) {
        filters += `[data-diversity="Analyzing Diversity Course"]`;
    }

    $("#course-rows tr.visible").removeClass(["visible", "odds", "evens"]);
    $(`#course-rows tr.valid-sem.valid-query${filters}`).addClass("visible").each(function(index){
        $(this).addClass(index % 2 ? "odds" : "evens");
    });
}