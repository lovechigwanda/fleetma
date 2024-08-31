import frappe

def create_trip_workflow():
    workflow = {
        "doctype": "Workflow",
        "workflow_name": "Trip Workflow",
        "document_type": "Trip",
        "is_active": 1,
        "workflow_state_field": "workflow_state",
        "states": [
            {
                "state": "To Load",
                "doc_status": 0,
                "allow_edit": "All",
                "update_field": "current_trip_status",
                "update_value": "To Load"
            },
            {
                "state": "In transit",
                "doc_status": 0,
                "allow_edit": "All",
                "update_field": "current_trip_status",
                "update_value": "In Transit"
            },
            {
                "state": "Completing",
                "doc_status": 0,
                "allow_edit": "All",
                "update_field": "current_trip_status",
                "update_value": "Completing"
            },
            {
                "state": "Trip Closed",
                "doc_status": 1,
                "allow_edit": "All",
                "update_field": "current_trip_status",
                "update_value": "Trip Closed"
            },
            {
                "state": "Cancelled",
                "doc_status": 2,
                "allow_edit": "Administrator",
                "update_field": "current_trip_status",
                "update_value": "Rejected"
            }
        ],
        "transitions": [
            {
                "state": "To Load",
                "action": "Mark As In Transit",
                "next_state": "In transit",
                "allowed": "All",
                "condition": "doc.total_revenue > 0"
            },
            {
                "state": "In transit",
                "action": "Mark As Completing",
                "next_state": "Completing",
                "allowed": "All"
            },
            {
                "state": "Completing",
                "action": "Mark As Closed",
                "next_state": "Trip Closed",
                "allowed": "All"
            },
            {
                "state": "Trip Closed",
                "action": "Cancel Trip",
                "next_state": "Cancelled",
                "allowed": "Administrator"
            }
        ]
    }

    if not frappe.db.exists("Workflow", {"workflow_name": "Trip Workflow"}):
        frappe.get_doc(workflow).insert()
        frappe.db.commit()
        print("Workflow created successfully!")
    else:
        print("Workflow already exists.")

create_trip_workflow()
