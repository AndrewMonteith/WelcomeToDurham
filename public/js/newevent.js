function fileUploadChanged(e) {
    const file = e.target.files[0];
    const preview = $("#event-logo"); 
    const reader = new FileReader();

    reader.addEventListener("load", function () {
        preview.attr("src", reader.result);
      }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}

$("#event-picture-input").change(fileUploadChanged);