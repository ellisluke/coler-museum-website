$(document).ready(function () {
    $('.artSelection').change(() => {
        console.log("changed selection");
        $("#galleryForm").submit();
    })

    setTimeout(() => {
          $("#statusMessage").fadeOut();
    }, 5000);
})
