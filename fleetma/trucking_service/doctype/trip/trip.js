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


// CREATE SALES INVOICE

 frappe.ui.form.on('Trip', {
    refresh: function(frm) {
        // Add the "Create Invoice" button to the form
        frm.add_custom_button(__('Create Invoice'), function() {
            // Call the function to create an invoice when the button is clicked
            create_invoice(frm);
        });
    }
});

function create_invoice(frm) {
    // Prepare the items array for the Sales Invoice by mapping fields from Revenue Charges
    let items = frm.doc.revenue_charges.map(d => ({
        item_code: d.charge, // Map the 'charge' field to 'item_code' in Sales Invoice Item
        qty: d.quantity,     // Map the 'quantity' field to 'qty' in Sales Invoice Item
        rate: d.amount       // Map the 'amount' field to 'rate' in Sales Invoice Item
    }));

    // Create a new Sales Invoice document
    frappe.new_doc('Sales Invoice', {
        customer: frm.doc.receivable_party, // Set the 'customer' field in Sales Invoice
        items: items                        // Set the 'items' field with the mapped items
    }).then(function(doc) {
        // Add items to the Sales Invoice's child table
        items.forEach(function(item) {
            let child = frappe.model.add_child(doc, 'items');
            frappe.model.set_value(child.doctype, child.name, 'item_code', item.item_code);
            frappe.model.set_value(child.doctype, child.name, 'qty', item.qty);
            frappe.model.set_value(child.doctype, child.name, 'rate', item.rate);
        });
        // Save the new Sales Invoice
        frappe.set_route('Form', 'Sales Invoice', doc.name);
    });
}
