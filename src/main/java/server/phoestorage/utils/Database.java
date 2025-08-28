package server.phoestorage.utils;

public class Database {
	public static String extractConstraintName(Throwable e) {
		Throwable t = e;
		while (t != null) {
			if (t instanceof org.hibernate.exception.ConstraintViolationException cve && cve.getConstraintName() != null)
				return cve.getConstraintName();
			t = t.getCause();
		}
		return null;
	}
}
