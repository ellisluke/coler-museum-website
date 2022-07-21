$(document).ready(function () {
    $('.artSelection').change(() => {
        console.log("changed selection");
        $("#galleryForm").submit();
    })

    setTimeout(() => {
          $('#save-status').hide()
    }, 5000);
})
