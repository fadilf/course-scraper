import init, { setup, render_results } from "./json-search/pkg/json_search.js";

init().then(() => {
    let jsonLoadPromise = setup(new URL("../collated_min.json", document.baseURI).href);

    let filters = {},
        $academicSemester = $("#academic-semester"),
        $keywords = $("#query"),
        $subjectCode = $('#subject-code'),
        $distributionGroup = $('#distribution-group'),
        $diversity = $('#diversity'),
        $courseRows = $("#course-rows");

    function updateFilters() {
        filters = {
            "Academic Semester": parseInt($academicSemester.val()),
            "Keywords": $keywords.val().trim().toUpperCase(),
            "Subject Code": $subjectCode.val(),
            "Distribution Group": $distributionGroup.val(),
            "Analyzing Diversity": $diversity.prop("checked"),
        }
        $courseRows.html(render_results(filters));
    }

    $academicSemester
        .add($subjectCode)
        .add($distributionGroup)
        .add($diversity)
        .on('change', function () {
            updateFilters();
        });

    $keywords.on('input', function () {
        updateFilters();
    });

    jsonLoadPromise.then(function(data){
        data[0].forEach(code => {
            $subjectCode.append(`<option value="${code}">${code}</option>`);
        });
        data[1].forEach((semester, idx) => {
            $academicSemester.append(`<option value="${idx}">${semester}</option>`);
        });
        updateFilters();
    });
});