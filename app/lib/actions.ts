"use server";

import {z} from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, {ssl: "require"});

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(["pending", "paid"]),
	date: z.string()
});

const CreateInvoice = FormSchema.omit({id: true, date: true});
const UpdateInvoice = FormSchema.omit({id: true, date: true});

export async function createInvoice(formData: FormData) {
	const {customerId, amount, status} = CreateInvoice.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status")
	});
	const amountCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];

	await sql`
	INSERT INTO invoices (customer_id, amount, status, date)
	VALUES (${customerId}, ${amountCents}, ${status}, ${date})
	`;

	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
	const {customerId, amount, status} = UpdateInvoice.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status")
	});
	const amountCents = amount * 100;
	await sql`
	UPDATE Invoices
	SET customer_id = ${customerId}, amount = ${amountCents}, status = ${status}
	WHERE id = ${id}
	`;
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
	await sql`DELETE FROM invoices WHERE id = ${id}`;
	revalidatePath("/dashboard/invoices");
}