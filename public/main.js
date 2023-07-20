//JS code for modal windows
function openVac(event, vacName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("vacation");
  for (i = 0; i < tabcontent.length; i++) {
  tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
  tablinks[i].className = tablinks[i].className.replace(" w3-amber", "");
  }
  document.getElementById(vacName).style.display = "block";
  event.currentTarget.className += " w3-amber";
}

// Js code for calculatin the quantity of vacation days 
$(document).ready(function() {
  // Event listener for the period_from and period_to fields
  $('#period_from, #period_to').on('change', function() {
    const start_date = new Date($('#period_from').val());
    const end_date = new Date($('#period_to').val());

    // Calculate the difference in days
    const diff_in_time = end_date.getTime() - start_date.getTime();
    const diff_in_days = diff_in_time / (1000 * 3600 * 24);

    // Update the quantity field
    $('#quantity').val(diff_in_days);
  });
});