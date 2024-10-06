// Copyright (c) 2024, Zvomaita Technologies and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Trip", {
//  refresh(frm) {

//  },
// });

// CALCULATE PROFIT IN TRIP DOCTYPE

frappe.ui.form.on('Trip', {
    // Trigger calculations when the form is refreshed or validated
    refresh: function(frm) {
        calculate_totals(frm);
    },
    validate: function(frm) {
        calculate_totals(frm);
    }
});

frappe.ui.form.on('Revenue Charges', {
    // Trigger calculation when quantity is changed
    quantity: function(frm, cdt, cdn) {
        calculate_revenue_total(frm, cdt, cdn);
    },
    // Trigger calculation when amount is changed
    amount: function(frm, cdt, cdn) {
        calculate_revenue_total(frm, cdt, cdn);
    },
    // Recalculate totals when a row is removed from Revenue Charges
    revenue_charges_remove: function(frm) {
        calculate_totals(frm);
    }
});

frappe.ui.form.on('Cost Charges', {
    // Trigger calculation when quantity is changed
    quantity: function(frm, cdt, cdn) {
        calculate_cost_total(frm, cdt, cdn);
    },
    // Trigger calculation when amount is changed
    amount: function(frm, cdt, cdn) {
        calculate_cost_total(frm, cdt, cdn);
    },
    // Recalculate totals when a row is removed from Cost Charges
    cost_charges_remove: function(frm) {
        calculate_totals(frm);
    }
});

function calculate_revenue_total(frm, cdt, cdn) {
    // Get the current row in Revenue Charges
    let row = locals[cdt][cdn];
    // Calculate the total amount for the current row
    row.total_amount = row.quantity * row.amount;
    // Refresh the Revenue Charges table to reflect the changes
    frm.refresh_field('revenue_charges');
    // Recalculate the overall totals
    calculate_totals(frm);
}

function calculate_cost_total(frm, cdt, cdn) {
    // Get the current row in Cost Charges
    let row = locals[cdt][cdn];
    // Calculate the total amount for the current row
    row.total_amount = row.quantity * row.amount;
    // Refresh the Cost Charges table to reflect the changes
    frm.refresh_field('cost_charges');
    // Recalculate the overall totals
    calculate_totals(frm);
}

function calculate_totals(frm) {
    let total_revenue = 0;
    let total_cost = 0;

    // Sum up all total_amount fields in Revenue Charges
    frm.doc.revenue_charges.forEach(function(d) {
        total_revenue += d.total_amount;
    });

    // Sum up all total_amount fields in Cost Charges
    frm.doc.cost_charges.forEach(function(d) {
        total_cost += d.total_amount;
    });

    // Set the total_revenue field
    frm.set_value('total_revenue', total_revenue);
    // Set the total_cost field
    frm.set_value('total_cost', total_cost);
    // Calculate and set the estimated_profit field
    frm.set_value('estimated_profit', total_revenue - total_cost);
}



/////////////////////////////////////////////////////////////////////

//UPDATE CURRENT MILESTONE

frappe.ui.form.on('Trip', {
    before_save: function(frm) {
        var lastRow = frm.doc.tracking_update.slice(-1)[0];

        if (lastRow) {
            // Get the value from the last row's trip_milestone field
            var lastValue = lastRow.trip_milestone;
            var lastValue1 = lastRow.update_comment;
            var lastValue2 = lastRow.update_date;

            // Set the value in the parent doctype's current_trip_milestone field
            frm.set_value('current_trip_milestone', lastValue);
            frm.set_value('current_update_comment', lastValue1);
            frm.set_value('updated_on', lastValue2);
            frm.refresh();
        }
    }
});


/////////////////////////////////////////////////////////////////////////////////

frappe.ui.form.on('Trip', {
    refresh: function(frm) {
        frm.add_custom_button(__('Invoice'), function() {
            frappe.db.get_list('Trip', {
                fields: ['name']
            }).then(trips => {
                let tripPromises = trips.map(trip => {
                    return frappe.db.get_doc('Trip', trip.name).then(tripDoc => {
                        return tripDoc.revenue_charges.map(charge => ({
                            trip_name: tripDoc.name,
                            charge: charge.charge,
                            quantity: charge.quantity,
                            amount: charge.amount
                        }));
                    });
                });

                Promise.all(tripPromises).then(tripCharges => {
                    let formatted_trips = [].concat(...tripCharges);

                    let dialog = new frappe.ui.Dialog({
                        title: 'Select Trips',
                        size: 'large',
                        fields: [
                            {
                                fieldtype: 'Table',
                                fieldname: 'trips',
                                label: 'Trips',
                                fields: [
                                    {fieldtype: 'Data', fieldname: 'trip_name', label: 'Trip Name', read_only: 1, in_list_view: 1, columns: 3},
                                    {fieldtype: 'Data', fieldname: 'charge', label: 'Charge', read_only: 1, in_list_view: 1, columns: 4},
                                    {fieldtype: 'Int', fieldname: 'quantity', label: 'Qty', read_only: 1, in_list_view: 1, columns: 1},
                                    {fieldtype: 'Currency', fieldname: 'amount', label: 'Amount', read_only: 1, in_list_view: 1, columns: 2}
                                ],
                                data: formatted_trips,
                                get_data: () => formatted_trips
                            }
                        ],
                        primary_action_label: 'Create Invoice',
                        primary_action: function(data) {
                            console.log(data.trips);
                            // Add your logic to create an invoice using the selected trips
                            dialog.hide();
                        }
                    });
                    dialog.show();
                });
            });
        }, __('Create'));
    }
});



